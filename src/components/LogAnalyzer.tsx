/**
 * LogAnalyzer - Refactored version
 *
 * This file now re-exports from the modular structure in LogAnalyzer/
 *
 * Previous version: 710 lines of monolithic code
 * Refactored version: Distributed across:
 *   - hooks/useTheme.ts (59 lines)
 *   - hooks/useLogParser.ts (68 lines)
 *   - components/HeaderUpload.tsx (77 lines)
 *   - components/UploadSection.tsx (62 lines)
 *   - components/SummaryCard.tsx (88 lines)
 *   - components/ErrorTable.tsx (148 lines)
 *   - components/ErrorDetailSheet.tsx (183 lines)
 *   - components/ResultsView.tsx (80 lines)
 *   - index.tsx (95 lines)
 *
 * Benefits:
 *   ✅ Single Responsibility Principle
 *   ✅ Easier to test each component
 *   ✅ Better code reusability
 *   ✅ Improved maintainability
 *   ✅ Clearer separation of concerns
 *   ✅ Performance optimizations (useMemo in ErrorTable)
 *   ✅ Better error handling (try-catch in localStorage)
 *   ✅ Accessibility improvements (table caption)
 */

export { LogAnalyzer } from './LogAnalyzer/index';
