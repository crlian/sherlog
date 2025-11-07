import init, { parse_log, test_normalize, test_fingerprint } from '../../parser-wasm/pkg/parser_wasm';

let wasmInitialized = false;

// ============================================================================
// TYPE DEFINITIONS (matching Rust structs)
// ============================================================================

export type ErrorType = 'error' | 'warning' | 'info';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ParsedError {
    id: string;
    type: ErrorType;
    severity: Severity;
    message: string;
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
            await init();
            wasmInitialized = true;
            console.log("✅ WASM Parser initialized");
        } catch (error) {
            console.error("❌ Failed to initialize WASM:", error);
            throw error;
        }
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
        return result as ParseResult;
    } catch (error) {
        console.error("Error parsing log content:", error);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS (for debugging/testing)
// ============================================================================

export async function testNormalize(message: string): Promise<string> {
    if (!wasmInitialized) {
        await initWasm();
    }
    return test_normalize(message);
}

export async function testFingerprint(message: string): Promise<string> {
    if (!wasmInitialized) {
        await initWasm();
    }
    return test_fingerprint(message);
}

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
