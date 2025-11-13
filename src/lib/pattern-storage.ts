// ============================================================================
// Pattern Storage (localStorage)
// ============================================================================

export interface LearnedPattern {
    id: string;
    name: string;
    template: string;
    regex: string;
    examples: string[];
    confidence: number;
    createdAt: string;
    appliedCount: number;
}

const STORAGE_KEY = 'sherlog_learned_patterns_v1';

/**
 * Get all learned patterns from localStorage
 */
export function getPatterns(): LearnedPattern[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const patterns = JSON.parse(stored);
        return Array.isArray(patterns) ? patterns : [];
    } catch (error) {
        console.error('Error loading patterns from localStorage:', error);
        return [];
    }
}

/**
 * Save a new pattern to localStorage
 */
export function savePattern(pattern: LearnedPattern): void {
    try {
        const patterns = getPatterns();
        patterns.push(pattern);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    } catch (error) {
        console.error('Error saving pattern to localStorage:', error);
        throw error;
    }
}

/**
 * Update an existing pattern
 */
export function updatePattern(id: string, updates: Partial<LearnedPattern>): void {
    try {
        const patterns = getPatterns();
        const index = patterns.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Pattern with id ${id} not found`);
        }

        patterns[index] = { ...patterns[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    } catch (error) {
        console.error('Error updating pattern:', error);
        throw error;
    }
}

/**
 * Delete a pattern by ID
 */
export function deletePattern(id: string): void {
    try {
        const patterns = getPatterns();
        const filtered = patterns.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error deleting pattern:', error);
        throw error;
    }
}

/**
 * Clear all learned patterns
 */
export function clearAllPatterns(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing patterns:', error);
        throw error;
    }
}

/**
 * Increment applied count for a pattern
 */
export function incrementPatternUsage(id: string, count: number = 1): void {
    try {
        const patterns = getPatterns();
        const pattern = patterns.find(p => p.id === id);

        if (pattern) {
            pattern.appliedCount = (pattern.appliedCount || 0) + count;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
        }
    } catch (error) {
        console.error('Error incrementing pattern usage:', error);
    }
}

/**
 * Export patterns as JSON
 */
export function exportPatterns(): string {
    const patterns = getPatterns();
    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        patterns
    }, null, 2);
}

/**
 * Import patterns from JSON
 */
export function importPatterns(jsonString: string): number {
    try {
        const data = JSON.parse(jsonString);

        if (!data.patterns || !Array.isArray(data.patterns)) {
            throw new Error('Invalid import format');
        }

        const existingPatterns = getPatterns();
        const newPatterns = data.patterns;

        // Merge, avoiding duplicates by name
        const merged = [...existingPatterns];
        let imported = 0;

        for (const pattern of newPatterns) {
            if (!merged.find(p => p.name === pattern.name)) {
                merged.push({
                    ...pattern,
                    id: crypto.randomUUID(), // Generate new ID
                    createdAt: new Date().toISOString(),
                    appliedCount: 0
                });
                imported++;
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return imported;
    } catch (error) {
        console.error('Error importing patterns:', error);
        throw error;
    }
}
