use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use regex::Regex;
use lazy_static::lazy_static;
use std::collections::HashMap;

// ============================================================================
// TYPES & STRUCTS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ErrorType {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedError {
    pub id: String,
    #[serde(rename = "type")]
    pub error_type: ErrorType,
    pub severity: Severity,
    pub message: String,
    pub full_trace: String,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub occurrences: u32,
    pub timestamp: Option<String>,
    pub fingerprint: String,
}

#[derive(Serialize, Deserialize)]
pub struct ParseResult {
    pub summary: LogStats,
    pub errors: Vec<ParsedError>,
}

#[derive(Serialize, Deserialize)]
pub struct LogStats {
    pub total_lines: usize,
    pub total_errors: usize,
    pub total_warnings: usize,
    pub total_info: usize,
    pub unique_errors: usize,
}

// ============================================================================
// REGEX PATTERNS (Multi-Language Support)
// ============================================================================

lazy_static! {
    // Node.js / JavaScript patterns
    static ref NODE_ERROR: Regex = Regex::new(
        r"(?m)^.*?(Error|Exception|TypeError|ReferenceError|SyntaxError|RangeError|URIError|EvalError):\s*(.+?)$"
    ).unwrap();

    static ref NODE_STACK: Regex = Regex::new(
        r"at\s+(?:(.+?)\s+\()?([^:]+):(\d+):(\d+)\)?"
    ).unwrap();

    // Python patterns
    static ref PYTHON_ERROR: Regex = Regex::new(
        r"(?m)^(.*?)(Error|Exception|Warning):\s*(.+?)$"
    ).unwrap();

    static ref PYTHON_STACK: Regex = Regex::new(
        r#"File\s+"([^"]+)",\s+line\s+(\d+)"#
    ).unwrap();

    // Java patterns
    static ref JAVA_ERROR: Regex = Regex::new(
        r"(?m)^.*?(Exception|Error):\s*(.+?)$"
    ).unwrap();

    static ref JAVA_STACK: Regex = Regex::new(
        r"at\s+([^\(]+)\(([^:]+):(\d+)\)"
    ).unwrap();

    // Generic ERROR/WARN/INFO patterns
    // Priority 1: Detect log level at the beginning of the line (after timestamp)
    static ref LOG_LEVEL_ERROR: Regex = Regex::new(
        r"(?i)^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\[\]]*\s+(ERROR|FATAL|CRITICAL)\b"
    ).unwrap();

    static ref LOG_LEVEL_WARN: Regex = Regex::new(
        r"(?i)^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\[\]]*\s+(WARN|WARNING)\b"
    ).unwrap();

    static ref LOG_LEVEL_INFO: Regex = Regex::new(
        r"(?i)^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\[\]]*\s+(INFO|DEBUG|TRACE)\b"
    ).unwrap();

    // Priority 2: Generic patterns (fallback for lines without timestamp)
    static ref GENERIC_ERROR: Regex = Regex::new(
        r"(?i)\b(ERROR|FATAL|CRITICAL)\b"
    ).unwrap();

    static ref GENERIC_WARN: Regex = Regex::new(
        r"(?i)\b(WARN|WARNING)\b"
    ).unwrap();

    static ref GENERIC_INFO: Regex = Regex::new(
        r"(?i)\b(INFO|DEBUG|TRACE)\b"
    ).unwrap();

    // Timestamp patterns (ISO 8601, common formats)
    static ref TIMESTAMP: Regex = Regex::new(
        r"(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)"
    ).unwrap();

    // Additional stack trace patterns
    static ref GO_STACK: Regex = Regex::new(
        r"^\s*([^\s]+)\(([^)]*)\)\s*$|^\s+([^:]+):(\d+)\s+[+0-9a-fx]+"
    ).unwrap();

    static ref RUST_PANIC: Regex = Regex::new(
        r"at\s+([^\(]+)\s+\(([^:]+):(\d+):(\d+)\)"
    ).unwrap();

    // Caused by / Suppressed patterns (for chained errors)
    static ref CAUSED_BY: Regex = Regex::new(
        r"(?i)^\s*(?:Caused by|Suppressed):\s*(.+)"
    ).unwrap();

    // Context lines (code snippets in stack traces)
    static ref CODE_CONTEXT: Regex = Regex::new(
        r"^\s*(?:\d+\s*[|>]|>)\s*.+"
    ).unwrap();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Normalize error message for fingerprinting
/// Removes numbers, timestamps, UUIDs to group similar errors
fn normalize_message(message: &str) -> String {
    let mut normalized = message.to_lowercase();

    // Remove numbers (but keep words)
    normalized = normalized
        .chars()
        .map(|c| if c.is_numeric() { 'X' } else { c })
        .collect();

    // Remove common variable parts
    normalized = normalized.replace("uuid", "ID");
    normalized = normalized.replace("guid", "ID");

    // Remove extra whitespace
    normalized = normalized.split_whitespace().collect::<Vec<_>>().join(" ");

    normalized
}

/// Generate fingerprint for error deduplication using blake3
fn generate_fingerprint(message: &str, file: &Option<String>, line: &Option<u32>) -> String {
    let normalized = normalize_message(message);
    let file_part = file.as_deref().unwrap_or("");
    let line_part = line.map(|l| l.to_string()).unwrap_or_default();

    let combined = format!("{}:{}:{}", normalized, file_part, line_part);
    let hash = blake3::hash(combined.as_bytes());

    hash.to_hex().to_string()
}

/// Extract timestamp from log line
fn extract_timestamp(line: &str) -> Option<String> {
    TIMESTAMP.captures(line)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
}

/// Determine error type from line content
/// Priority 1: Check log level in structured logs (e.g., "2025-05-27 00:40:12,694 INFO")
/// Priority 2: Check for exception patterns (Node, Python, Java)
/// Priority 3: Fallback to generic keyword matching
fn determine_error_type(line: &str) -> ErrorType {
    // Priority 1: Check explicit log level (prevents "INFO ... error message" from being classified as ERROR)
    if LOG_LEVEL_ERROR.is_match(line) {
        return ErrorType::Error;
    }
    if LOG_LEVEL_WARN.is_match(line) {
        return ErrorType::Warning;
    }
    if LOG_LEVEL_INFO.is_match(line) {
        return ErrorType::Info;
    }

    // Priority 2: Check for exception patterns (these are actual errors even without ERROR keyword)
    if NODE_ERROR.is_match(line) || PYTHON_ERROR.is_match(line) || JAVA_ERROR.is_match(line) {
        return ErrorType::Error;
    }

    // Priority 3: Fallback to generic keyword matching (for logs without structured levels)
    if GENERIC_ERROR.is_match(line) {
        return ErrorType::Error;
    }
    if GENERIC_WARN.is_match(line) {
        return ErrorType::Warning;
    }
    if GENERIC_INFO.is_match(line) {
        return ErrorType::Info;
    }

    // Default: treat as info
    ErrorType::Info
}

/// Determine severity based on error type and content
fn determine_severity(error_type: &ErrorType, message: &str) -> Severity {
    match error_type {
        ErrorType::Error => {
            if message.to_lowercase().contains("fatal") ||
               message.to_lowercase().contains("critical") ||
               message.to_lowercase().contains("segfault") ||
               message.to_lowercase().contains("panic") {
                Severity::Critical
            } else if message.to_lowercase().contains("null") ||
                      message.to_lowercase().contains("undefined") ||
                      message.to_lowercase().contains("reference") {
                Severity::High
            } else {
                Severity::Medium
            }
        },
        ErrorType::Warning => Severity::Low,
        ErrorType::Info => Severity::Low,
    }
}

/// Extract file location from Node.js stack trace
fn extract_node_location(stack_line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    if let Some(caps) = NODE_STACK.captures(stack_line) {
        let file = caps.get(2).map(|m| m.as_str().to_string());
        let line = caps.get(3).and_then(|m| m.as_str().parse::<u32>().ok());
        let column = caps.get(4).and_then(|m| m.as_str().parse::<u32>().ok());
        return (file, line, column);
    }
    (None, None, None)
}

/// Extract file location from Python stack trace
fn extract_python_location(stack_line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    if let Some(caps) = PYTHON_STACK.captures(stack_line) {
        let file = caps.get(1).map(|m| m.as_str().to_string());
        let line = caps.get(2).and_then(|m| m.as_str().parse::<u32>().ok());
        return (file, line, None);
    }
    (None, None, None)
}

/// Extract file location from Java stack trace
fn extract_java_location(stack_line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    if let Some(caps) = JAVA_STACK.captures(stack_line) {
        let file = caps.get(2).map(|m| m.as_str().to_string());
        let line = caps.get(3).and_then(|m| m.as_str().parse::<u32>().ok());
        return (file, line, None);
    }
    (None, None, None)
}

/// Extract file location from Go stack trace
fn extract_go_location(stack_line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    if let Some(caps) = GO_STACK.captures(stack_line) {
        // Go stack traces have two formats:
        // 1. "file.go:45 +0x123"
        // 2. "package/path"
        if let Some(file) = caps.get(3) {
            let line = caps.get(4).and_then(|m| m.as_str().parse::<u32>().ok());
            return (Some(file.as_str().to_string()), line, None);
        }
    }
    (None, None, None)
}

/// Extract file location from Rust panic trace
fn extract_rust_location(stack_line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    if let Some(caps) = RUST_PANIC.captures(stack_line) {
        let file = caps.get(2).map(|m| m.as_str().to_string());
        let line = caps.get(3).and_then(|m| m.as_str().parse::<u32>().ok());
        let column = caps.get(4).and_then(|m| m.as_str().parse::<u32>().ok());
        return (file, line, column);
    }
    (None, None, None)
}

/// Check if a line is part of a stack trace
fn is_stack_trace_line(line: &str) -> bool {
    let trimmed = line.trim();

    // Node.js/JavaScript stack traces
    if trimmed.starts_with("at ") || line.contains("    at ") {
        return true;
    }

    // Python stack traces
    if trimmed.starts_with("File \"") || trimmed.starts_with("File '") {
        return true;
    }

    // Java stack traces
    if JAVA_STACK.is_match(line) {
        return true;
    }

    // Go stack traces (indented)
    if GO_STACK.is_match(line) {
        return true;
    }

    // Rust panic traces
    if RUST_PANIC.is_match(line) {
        return true;
    }

    // Caused by / Suppressed
    if CAUSED_BY.is_match(line) {
        return true;
    }

    // Code context lines
    if CODE_CONTEXT.is_match(line) {
        return true;
    }

    // Indented lines (likely part of stack trace)
    if trimmed.len() > 0 && line.starts_with("    ") && !trimmed.starts_with("//") {
        return true;
    }

    false
}

/// Try to extract location from any supported format
fn extract_location_any_format(line: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    // Try Node.js
    let (file, line_num, column) = extract_node_location(line);
    if file.is_some() {
        return (file, line_num, column);
    }

    // Try Python
    let (file, line_num, column) = extract_python_location(line);
    if file.is_some() {
        return (file, line_num, column);
    }

    // Try Java
    let (file, line_num, column) = extract_java_location(line);
    if file.is_some() {
        return (file, line_num, column);
    }

    // Try Go
    let (file, line_num, column) = extract_go_location(line);
    if file.is_some() {
        return (file, line_num, column);
    }

    // Try Rust
    let (file, line_num, column) = extract_rust_location(line);
    if file.is_some() {
        return (file, line_num, column);
    }

    (None, None, None)
}

/// Extract error message from different formats
fn extract_error_message(line: &str) -> String {
    // Try Node.js format
    if let Some(caps) = NODE_ERROR.captures(line) {
        if let Some(msg) = caps.get(2) {
            return msg.as_str().to_string();
        }
    }

    // Try Python format
    if let Some(caps) = PYTHON_ERROR.captures(line) {
        if let Some(msg) = caps.get(3) {
            return msg.as_str().to_string();
        }
    }

    // Try Java format
    if let Some(caps) = JAVA_ERROR.captures(line) {
        if let Some(msg) = caps.get(2) {
            return msg.as_str().to_string();
        }
    }

    // Try Caused by
    if let Some(caps) = CAUSED_BY.captures(line) {
        if let Some(msg) = caps.get(1) {
            return msg.as_str().to_string();
        }
    }

    // Fallback: return cleaned line
    line.trim().to_string()
}

// ============================================================================
// MAIN PARSING LOGIC
// ============================================================================

/// Parse log content and extract errors with deduplication
fn parse_log_content(content: &str) -> ParseResult {
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();

    let mut error_map: HashMap<String, ParsedError> = HashMap::new();
    let mut current_stack_trace = String::new();
    let mut in_stack_trace = false;
    let mut last_error_fingerprint: Option<String> = None;

    let mut total_errors = 0;
    let mut total_warnings = 0;
    let mut total_info = 0;

    for (_idx, line) in lines.iter().enumerate() {
        let error_type = determine_error_type(line);

        // Check if this is an error line
        let is_error_line = NODE_ERROR.is_match(line) ||
                           PYTHON_ERROR.is_match(line) ||
                           JAVA_ERROR.is_match(line) ||
                           GENERIC_ERROR.is_match(line);

        if is_error_line {
            // Extract error details
            let message = extract_error_message(line);
            let timestamp = extract_timestamp(line);

            // Try to extract location from this line using any format
            let (file, line_num, column) = extract_location_any_format(line);

            let severity = determine_severity(&error_type, &message);
            let fingerprint = generate_fingerprint(&message, &file, &line_num);

            // Update counts
            match error_type {
                ErrorType::Error => total_errors += 1,
                ErrorType::Warning => total_warnings += 1,
                ErrorType::Info => total_info += 1,
            }

            // Check if we've seen this error before
            if let Some(existing) = error_map.get_mut(&fingerprint) {
                // Increment occurrence count
                existing.occurrences += 1;
                // Update full trace with new occurrence
                existing.full_trace.push_str("\n\n---\n\n");
                existing.full_trace.push_str(line);
            } else {
                // New error - create entry
                let parsed_error = ParsedError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: error_type.clone(),
                    severity,
                    message: message.clone(),
                    full_trace: line.to_string(),
                    file: file.clone(),
                    line: line_num,
                    column,
                    occurrences: 1,
                    timestamp,
                    fingerprint: fingerprint.clone(),
                };

                error_map.insert(fingerprint.clone(), parsed_error);
            }

            last_error_fingerprint = Some(fingerprint);
            current_stack_trace = String::new();
            in_stack_trace = true;
        } else if in_stack_trace && is_stack_trace_line(line) {
            // This is a stack trace line - append to current error's trace
            current_stack_trace.push('\n');
            current_stack_trace.push_str(line);

            if let Some(ref fp) = last_error_fingerprint {
                if let Some(error) = error_map.get_mut(fp) {
                    error.full_trace.push('\n');
                    error.full_trace.push_str(line);

                    // Try to extract location if we don't have one yet
                    // This is important for multi-line stack traces where the error message
                    // doesn't contain the location, but the stack trace does
                    if error.file.is_none() {
                        let (file, line_num, column) = extract_location_any_format(line);
                        if file.is_some() {
                            error.file = file;
                            error.line = line_num;
                            error.column = column;
                        }
                    }
                }
            }
        } else if in_stack_trace && CAUSED_BY.is_match(line) {
            // Handle chained errors (Caused by:, Suppressed:)
            // These are still part of the same error trace
            if let Some(ref fp) = last_error_fingerprint {
                if let Some(error) = error_map.get_mut(fp) {
                    error.full_trace.push('\n');
                    error.full_trace.push_str(line);
                }
            }
            // Continue in stack trace mode for the chained error
        } else if !line.trim().is_empty() {
            // Non-empty line that's not a stack trace - might be a warning or info
            if GENERIC_WARN.is_match(line) {
                total_warnings += 1;
            } else if GENERIC_INFO.is_match(line) {
                total_info += 1;
            }
            in_stack_trace = false;
        }
    }

    // Convert to Vec and sort by occurrences (descending)
    let mut errors: Vec<ParsedError> = error_map.into_values().collect();
    errors.sort_by(|a, b| b.occurrences.cmp(&a.occurrences));

    let unique_errors = errors.len();

    // Return top 20 only
    errors.truncate(20);

    ParseResult {
        summary: LogStats {
            total_lines,
            total_errors,
            total_warnings,
            total_info,
            unique_errors,
        },
        errors,
    }
}

// ============================================================================
// STREAMING PARSER (New - for large file support)
// ============================================================================

/// Streaming parser that processes lines incrementally
/// This allows processing files larger than available memory
#[wasm_bindgen]
pub struct LogParser {
    error_map: HashMap<String, ParsedError>,
    total_lines: usize,
    total_errors: usize,
    total_warnings: usize,
    total_info: usize,

    // State for multi-line stack traces
    in_stack_trace: bool,
    last_error_fingerprint: Option<String>,
    current_stack_trace: String,
}

#[wasm_bindgen]
impl LogParser {
    /// Create a new parser instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> LogParser {
        LogParser {
            error_map: HashMap::new(),
            total_lines: 0,
            total_errors: 0,
            total_warnings: 0,
            total_info: 0,
            in_stack_trace: false,
            last_error_fingerprint: None,
            current_stack_trace: String::new(),
        }
    }

    /// Process a single line of log content
    /// This method is called repeatedly for each line in the file
    #[wasm_bindgen]
    pub fn process_line(&mut self, line: &str) {
        self.total_lines += 1;

        let error_type = determine_error_type(line);

        // Check if this is an error line
        let is_error_line = NODE_ERROR.is_match(line) ||
                           PYTHON_ERROR.is_match(line) ||
                           JAVA_ERROR.is_match(line) ||
                           GENERIC_ERROR.is_match(line);

        if is_error_line {
            // Extract error details
            let message = extract_error_message(line);
            let timestamp = extract_timestamp(line);

            // Try to extract location from this line using any format
            let (file, line_num, column) = extract_location_any_format(line);

            let severity = determine_severity(&error_type, &message);
            let fingerprint = generate_fingerprint(&message, &file, &line_num);

            // Update counts
            match error_type {
                ErrorType::Error => self.total_errors += 1,
                ErrorType::Warning => self.total_warnings += 1,
                ErrorType::Info => self.total_info += 1,
            }

            // Check if we've seen this error before
            if let Some(existing) = self.error_map.get_mut(&fingerprint) {
                // Increment occurrence count
                existing.occurrences += 1;
                // Update full trace with new occurrence
                existing.full_trace.push_str("\n\n---\n\n");
                existing.full_trace.push_str(line);
            } else {
                // New error - create entry
                let parsed_error = ParsedError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: error_type.clone(),
                    severity,
                    message: message.clone(),
                    full_trace: line.to_string(),
                    file: file.clone(),
                    line: line_num,
                    column,
                    occurrences: 1,
                    timestamp,
                    fingerprint: fingerprint.clone(),
                };

                self.error_map.insert(fingerprint.clone(), parsed_error);
            }

            self.last_error_fingerprint = Some(fingerprint);
            self.current_stack_trace = String::new();
            self.in_stack_trace = true;
        } else if self.in_stack_trace && is_stack_trace_line(line) {
            // This is a stack trace line - append to current error's trace
            self.current_stack_trace.push('\n');
            self.current_stack_trace.push_str(line);

            if let Some(ref fp) = self.last_error_fingerprint {
                if let Some(error) = self.error_map.get_mut(fp) {
                    error.full_trace.push('\n');
                    error.full_trace.push_str(line);

                    // Try to extract location if we don't have one yet
                    if error.file.is_none() {
                        let (file, line_num, column) = extract_location_any_format(line);
                        if file.is_some() {
                            error.file = file;
                            error.line = line_num;
                            error.column = column;
                        }
                    }
                }
            }
        } else if self.in_stack_trace && CAUSED_BY.is_match(line) {
            // Handle chained errors (Caused by:, Suppressed:)
            if let Some(ref fp) = self.last_error_fingerprint {
                if let Some(error) = self.error_map.get_mut(fp) {
                    error.full_trace.push('\n');
                    error.full_trace.push_str(line);
                }
            }
        } else if !line.trim().is_empty() {
            // Non-empty line that's not a stack trace - might be a warning or info
            if GENERIC_WARN.is_match(line) {
                self.total_warnings += 1;
            } else if GENERIC_INFO.is_match(line) {
                self.total_info += 1;
            }
            self.in_stack_trace = false;
        }
    }

    /// Get the final parse results
    /// Call this after all lines have been processed
    #[wasm_bindgen]
    pub fn get_result(&self) -> JsValue {
        // Convert to Vec and sort by occurrences (descending)
        let mut errors: Vec<ParsedError> = self.error_map.values().cloned().collect();
        errors.sort_by(|a, b| b.occurrences.cmp(&a.occurrences));

        let unique_errors = errors.len();

        // Return top 20 only
        errors.truncate(20);

        let result = ParseResult {
            summary: LogStats {
                total_lines: self.total_lines,
                total_errors: self.total_errors,
                total_warnings: self.total_warnings,
                total_info: self.total_info,
                unique_errors,
            },
            errors,
        };

        serde_wasm_bindgen::to_value(&result).unwrap()
    }
}

// ============================================================================
// WASM EXPORTS (Legacy - kept for backwards compatibility)
// ============================================================================

#[wasm_bindgen]
pub fn parse_log(content: &str) -> JsValue {
    let result = parse_log_content(content);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

// For debugging - export individual functions
#[wasm_bindgen]
pub fn test_normalize(message: &str) -> String {
    normalize_message(message)
}

#[wasm_bindgen]
pub fn test_fingerprint(message: &str) -> String {
    generate_fingerprint(message, &None, &None)
}
