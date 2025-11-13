import { useState } from 'react';
import type { ParsedError } from '@/lib/wasm-parser';
import { usePatternLearning, type DetectedPattern } from '../hooks/usePatternLearning';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Sparkles, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface PatternLearningModalProps {
    errors: ParsedError[];
    open: boolean;
    onClose: () => void;
    onPatternSaved?: () => void;
}

export function PatternLearningModal({
    errors,
    open,
    onClose,
    onPatternSaved
}: PatternLearningModalProps) {
    const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
    const [detectedPattern, setDetectedPattern] = useState<DetectedPattern | null>(null);
    const [patternName, setPatternName] = useState('');

    const { detectPattern, saveDetectedPattern, isLoading, error, clearError } = usePatternLearning();

    const handleToggleError = (message: string) => {
        setSelectedErrors(prev =>
            prev.includes(message)
                ? prev.filter(e => e !== message)
                : [...prev, message]
        );

        // Clear detected pattern when selection changes
        setDetectedPattern(null);
    };

    const handleDetect = async () => {
        if (selectedErrors.length < 2) {
            return;
        }

        console.log('🔍 Detecting pattern from messages:', selectedErrors);
        const pattern = await detectPattern(selectedErrors);

        if (pattern) {
            console.log('✅ Pattern detected:', {
                template: pattern.template,
                regex: pattern.regex,
                confidence: pattern.confidence
            });
            setDetectedPattern(pattern);
            // Suggest a name based on common parts
            const suggestedName = pattern.common_parts
                .slice(0, 3)
                .join(' ')
                .trim() || 'Custom Pattern';
            setPatternName(suggestedName);
        } else {
            console.log('❌ No pattern detected');
        }
    };

    const handleSave = () => {
        if (!detectedPattern || !patternName.trim()) {
            return;
        }

        try {
            console.log('💾 Saving pattern:', {
                name: patternName.trim(),
                template: detectedPattern.template,
                regex: detectedPattern.regex,
                examples: selectedErrors
            });

            saveDetectedPattern(detectedPattern, patternName.trim(), selectedErrors);

            // Reset state
            setSelectedErrors([]);
            setDetectedPattern(null);
            setPatternName('');

            // Notify parent (triggers re-analysis)
            if (onPatternSaved) {
                console.log('🔄 Triggering re-analysis...');
                onPatternSaved();
            }

            onClose();
        } catch (err) {
            console.error('Failed to save pattern:', err);
        }
    };

    const handleClose = () => {
        setSelectedErrors([]);
        setDetectedPattern(null);
        setPatternName('');
        clearError();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Teach Pattern Recognition
                    </DialogTitle>
                    <DialogDescription>
                        Select 2-3 similar error messages to automatically detect their common pattern
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Error selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                            Select similar errors ({selectedErrors.length} selected)
                        </Label>

                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            {errors.map((error) => (
                                <label
                                    key={error.id}
                                    className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={selectedErrors.includes(error.message)}
                                        onChange={() => handleToggleError(error.message)}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                            {error.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {error.occurrences}× occurrences
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {error.type}
                                            </Badge>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Detect button */}
                    <Button
                        onClick={handleDetect}
                        disabled={selectedErrors.length < 2 || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                Detecting Pattern...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Detect Pattern
                            </>
                        )}
                    </Button>

                    {/* Error message */}
                    {error && (
                        <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
                                        Pattern Detection Failed
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                        {error}
                                    </p>
                                </div>
                                <button onClick={clearError}>
                                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Detected pattern preview */}
                    {detectedPattern && (
                        <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm text-green-900 dark:text-green-100 font-semibold">
                                            ✨ Pattern Detected
                                        </p>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-green-700 dark:text-green-300">
                                                Template:
                                            </Label>
                                            <p className="font-mono text-sm text-green-900 dark:text-green-100 bg-white dark:bg-green-950/50 p-2 rounded border border-green-200 dark:border-green-800">
                                                {detectedPattern.template}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div>
                                                <Label className="text-xs text-green-700 dark:text-green-300">
                                                    Confidence:
                                                </Label>
                                                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                                                    {(detectedPattern.confidence * 100).toFixed(0)}%
                                                </p>
                                            </div>

                                            {detectedPattern.variable_segments.length > 0 && (
                                                <div>
                                                    <Label className="text-xs text-green-700 dark:text-green-300">
                                                        Variable values found:
                                                    </Label>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {detectedPattern.variable_segments.slice(0, 5).map((seg, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="secondary"
                                                                className="text-xs font-mono"
                                                            >
                                                                {seg}
                                                            </Badge>
                                                        ))}
                                                        {detectedPattern.variable_segments.length > 5 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{detectedPattern.variable_segments.length - 5} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pattern name input */}
                                        <div className="space-y-1">
                                            <Label htmlFor="pattern-name" className="text-xs text-green-700 dark:text-green-300">
                                                Pattern name:
                                            </Label>
                                            <Input
                                                id="pattern-name"
                                                value={patternName}
                                                onChange={(e) => setPatternName(e.target.value)}
                                                placeholder="e.g., Database connection errors"
                                                className="bg-white dark:bg-green-950/50 border-green-200 dark:border-green-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {detectedPattern && (
                        <Button
                            onClick={handleSave}
                            disabled={!patternName.trim()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Save Pattern
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
