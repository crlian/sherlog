/* tslint:disable */
/* eslint-disable */
/**
 * Detect pattern from user-provided examples
 * Returns detected pattern with template, regex, and confidence score
 */
export function detect_pattern(examples: any): any;
/**
 * Cluster errors by similarity threshold
 * Returns Vec<Vec<String>> of clustered errors
 */
export function cluster_errors(errors: any, threshold: number): any;
export function test_fingerprint(template: string): string;
/**
 * Clear all custom patterns
 */
export function clear_custom_patterns(): void;
/**
 * Set custom patterns to be applied during parsing
 * Patterns are applied BEFORE universal patterns (UUID, IP, ID)
 */
export function set_custom_patterns(patterns_json: any): void;
export function test_extract_template(message: string): any;
export function parse_log(content: string): any;
/**
 * Streaming parser that processes lines incrementally
 * This allows processing files larger than available memory
 */
export class LogParser {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get the final parse results
   * Call this after all lines have been processed
   */
  get_result(): any;
  /**
   * Process a single line of log content
   * This method is called repeatedly for each line in the file
   */
  process_line(line: string): void;
  /**
   * Create a new parser instance
   */
  constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_logparser_free: (a: number, b: number) => void;
  readonly clear_custom_patterns: () => void;
  readonly cluster_errors: (a: any, b: number) => any;
  readonly detect_pattern: (a: any) => any;
  readonly logparser_get_result: (a: number) => any;
  readonly logparser_new: () => number;
  readonly logparser_process_line: (a: number, b: number, c: number) => void;
  readonly parse_log: (a: number, b: number) => any;
  readonly set_custom_patterns: (a: any) => void;
  readonly test_extract_template: (a: number, b: number) => any;
  readonly test_fingerprint: (a: number, b: number) => [number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
