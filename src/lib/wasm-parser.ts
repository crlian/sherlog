import init, { parse_log } from '../../parser-wasm/pkg/parser_wasm';

let wasmInitialized = false;

// ============================================================================
// TYPE DEFINITIONS (matching Rust structs)
// ============================================================================

export type ErrorType = 'error' | 'warning' | 'info';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type VariableType = 'numericid' | 'ipaddress' | 'uuid';

export interface Variable {
    placeholder: string;  // e.g., "{ID}", "{TIME}", "{TABLE}"
    value: string;        // Original value from the log
    var_type: VariableType;
}

export interface ParsedError {
    id: string;
    type: ErrorType;
    severity: Severity;
    message: string;
    template: string;              // NEW: Normalized message with variable placeholders
    variables: Variable[];         // NEW: List of extracted variables
    full_trace: string;
    file: string | null;
    line: number | null;
    column: number | null;
    occurrences: number;
    timestamp: string | null;
    fingerprint: string;
}

export interface LogStats {
    total_lines: number;
    total_errors: number;
    total_warnings: number;
    total_info: number;
    unique_errors: number;
}

export interface ParseResult {
    summary: LogStats;
    errors: ParsedError[];
}

// ============================================================================
// WASM INITIALIZATION
// ============================================================================

export async function initWasm(): Promise<void> {
    if (!wasmInitialized) {
        try {
            console.log("🔄 Initializing WASM parser...");
            await init();
            wasmInitialized = true;
            console.log("✅ WASM Parser initialized successfully");
        } catch (error) {
            console.error("❌ Failed to initialize WASM:", error);
            console.error("WASM init error details:", error);
            throw new Error(`WASM initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
        console.log("ℹ️ WASM already initialized");
    }
}

// ============================================================================
// STREAMING HELPERS (for large file support)
// ============================================================================

/**
 * Read file in chunks using ReadableStream API
 * This prevents loading the entire file into memory at once
 */
async function* readFileInChunks(file: File, chunkSize: number = 10 * 1024 * 1024) {
    const stream = file.stream();
    const reader = stream.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            // value is a Uint8Array (raw bytes)
            // Convert to text
            const text = new TextDecoder().decode(value, { stream: true });

            yield text;
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Read file line by line using chunks
 * Handles lines that are split across chunks
 */
async function* readLinesFromFile(file: File, chunkSize: number = 10 * 1024 * 1024) {
    let buffer = ''; // Buffer for incomplete lines

    for await (const chunk of readFileInChunks(file, chunkSize)) {
        // Concatenate previous buffer with new chunk
        buffer += chunk;

        // Split by newlines
        const lines = buffer.split('\n');

        // The last line might be incomplete, save it for next chunk
        buffer = lines.pop() || '';

        // Yield all complete lines
        for (const line of lines) {
            if (line.trim()) { // Skip empty lines
                yield line;
            }
        }
    }

    // Process the last line if there's anything left in buffer
    if (buffer.trim()) {
        yield buffer;
    }
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

export async function parseLogFile(file: File): Promise<ParseResult> {
    if (!wasmInitialized) {
        await initWasm();
    }

    try {
        const content = await file.text();
        const result = parse_log(content);

        // Debug logging
        console.log('WASM parse_log result:', result);

        // Validate result structure
        if (!result) {
            throw new Error('WASM parser returned null or undefined');
        }

        if (typeof result !== 'object') {
            throw new Error(`WASM parser returned invalid type: ${typeof result}`);
        }

        if (!('summary' in result) || !('errors' in result)) {
            console.error('Invalid result structure:', result);
            throw new Error('WASM parser returned invalid structure (missing summary or errors)');
        }

        return result as ParseResult;
    } catch (error) {
        console.error("Error parsing log file:", error);
        throw error;
    }
}

export async function parseLogContent(content: string): Promise<ParseResult> {
    if (!wasmInitialized) {
        await initWasm();
    }

    try {
        const result = parse_log(content);

        // Debug logging
        console.log('WASM parse_log result:', result);

        // Validate result structure
        if (!result) {
            throw new Error('WASM parser returned null or undefined');
        }

        if (typeof result !== 'object') {
            throw new Error(`WASM parser returned invalid type: ${typeof result}`);
        }

        if (!('summary' in result) || !('errors' in result)) {
            console.error('Invalid result structure:', result);
            throw new Error('WASM parser returned invalid structure (missing summary or errors)');
        }

        return result as ParseResult;
    } catch (error) {
        console.error("Error parsing log content:", error);
        throw error;
    }
}

/**
 * Parse log file using streaming (for large files >100MB)
 * This processes the file line by line, keeping memory usage constant
 *
 * @param file - The log file to parse
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns ParseResult with aggregated error statistics
 */
export async function parseLogFileStreaming(
    file: File,
    onProgress?: (progress: number) => void
): Promise<ParseResult> {
    if (!wasmInitialized) {
        await initWasm();
    }

    try {
        // Dynamically import the LogParser class
        const { LogParser } = await import('../../parser-wasm/pkg/parser_wasm');

        // Create parser instance
        const parser = new LogParser();

        let processedBytes = 0;
        const totalBytes = file.size;

        console.log(`🔄 Starting streaming parse of ${(totalBytes / 1024 / 1024).toFixed(2)}MB file...`);

        let lineCount = 0;
        const startTime = performance.now();

        // Process file line by line
        for await (const line of readLinesFromFile(file)) {
            parser.process_line(line);
            lineCount++;

            // Update progress (estimate based on bytes processed)
            processedBytes += line.length + 1; // +1 for newline

            // Yield control to browser every 1000 lines to keep UI responsive
            if (lineCount % 1000 === 0) {
                const progress = Math.min((processedBytes / totalBytes) * 100, 100);
                if (onProgress) {
                    onProgress(progress);
                }

                // Yield to browser to update UI and prevent freezing
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Get final results
        const result = parser.get_result();

        // Free WASM memory
        parser.free();

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Streaming parse complete in ${duration}s (${lineCount} lines)`);

        // Final progress update
        if (onProgress) {
            onProgress(100);
        }

        // Validate result
        if (!result || typeof result !== 'object') {
            throw new Error('WASM parser returned invalid result');
        }

        if (!('summary' in result) || !('errors' in result)) {
            console.error('Invalid result structure:', result);
            throw new Error('WASM parser returned invalid structure (missing summary or errors)');
        }

        return result as ParseResult;
    } catch (error) {
        console.error("Error during streaming parse:", error);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS (for debugging/testing)
// ============================================================================
// Note: test_normalize and test_fingerprint are not exported in production build
// Uncomment and rebuild WASM with debug features if needed for testing

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: Severity): string {
    switch (severity) {
        case 'critical':
            return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'high':
            return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        case 'medium':
            return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        case 'low':
            return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
}

/**
 * Get type badge color
 */
export function getTypeColor(type: ErrorType): string {
    switch (type) {
        case 'error':
            return 'text-red-400 bg-red-500/10 border-red-500/20';
        case 'warning':
            return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        case 'info':
            return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
}

/**
 * Get severity icon identifier for Lucide icons
 */
export function getSeverityIcon(severity: Severity): string {
    switch (severity) {
        case 'critical':
            return 'alert-circle';
        case 'high':
            return 'alert-triangle';
        case 'medium':
            return 'alert-octagon';
        case 'low':
            return 'info';
    }
}

/**
 * Get type icon identifier for Lucide icons
 */
export function getTypeIcon(type: ErrorType): string {
    switch (type) {
        case 'error':
            return 'x-circle';
        case 'warning':
            return 'triangle-alert';
        case 'info':
            return 'info';
    }
}

/**
 * Format file location as file:line:column
 */
export function formatLocation(error: ParsedError): string {
    if (!error.file) return 'Unknown location';

    let location = error.file;
    if (error.line !== null) {
        location += `:${error.line}`;
        if (error.column !== null) {
            location += `:${error.column}`;
        }
    }
    return location;
}

/**
 * Format occurrences count
 */
export function formatOccurrences(count: number): string {
    if (count === 1) return '1 time';
    if (count < 1000) return `${count} times`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k times`;
    return `${(count / 1000000).toFixed(1)}M times`;
}

/**
 * Truncate message if too long
 */
export function truncateMessage(message: string, maxLength: number = 100): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
}
