import { useState, useEffect, useCallback } from 'react';
import { detect_pattern } from '../../../../parser-wasm/pkg/parser_wasm';
import {
    getPatterns,
    savePattern,
    deletePattern,
    updatePattern,
    type LearnedPattern
} from '@/lib/pattern-storage';

export interface DetectedPattern {
    template: string;
    regex: string;
    confidence: number;
    variable_segments: string[];
    common_parts: string[];
}

export function usePatternLearning() {
    const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load patterns from localStorage on mount
    useEffect(() => {
        loadPatterns();
    }, []);

    const loadPatterns = useCallback(() => {
        try {
            const patterns = getPatterns();
            setLearnedPatterns(patterns);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load patterns');
        }
    }, []);

    /**
     * Detect pattern from user-selected examples using WASM
     */
    const detectPattern = useCallback(async (examples: string[]): Promise<DetectedPattern | null> => {
        if (examples.length < 2) {
            setError('Please select at least 2 similar errors');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Call WASM function
            const result = detect_pattern(examples);

            if (!result) {
                setError('Could not detect a pattern. Examples might be too different.');
                return null;
            }

            return result as DetectedPattern;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to detect pattern';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Save detected pattern with a user-provided name
     */
    const saveDetectedPattern = useCallback((
        pattern: DetectedPattern,
        name: string,
        examples: string[]
    ) => {
        try {
            const learned: LearnedPattern = {
                id: crypto.randomUUID(),
                name,
                template: pattern.template,
                regex: pattern.regex,
                examples,
                confidence: pattern.confidence,
                createdAt: new Date().toISOString(),
                appliedCount: 0
            };

            savePattern(learned);
            loadPatterns(); // Refresh list
            return learned;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save pattern';
            setError(message);
            throw err;
        }
    }, [loadPatterns]);

    /**
     * Delete a learned pattern
     */
    const removePattern = useCallback((id: string) => {
        try {
            deletePattern(id);
            loadPatterns(); // Refresh list
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete pattern';
            setError(message);
        }
    }, [loadPatterns]);

    /**
     * Update a pattern
     */
    const modifyPattern = useCallback((id: string, updates: Partial<LearnedPattern>) => {
        try {
            updatePattern(id, updates);
            loadPatterns(); // Refresh list
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update pattern';
            setError(message);
        }
    }, [loadPatterns]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        learnedPatterns,
        isLoading,
        error,

        // Methods
        detectPattern,
        saveDetectedPattern,
        removePattern,
        modifyPattern,
        loadPatterns,
        clearError
    };
}
