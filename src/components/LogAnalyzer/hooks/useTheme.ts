import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface UseThemeReturn {
    theme: Theme | null;
    mounted: boolean;
    toggleTheme: () => void;
}

/**
 * Custom hook to manage theme (light/dark mode)
 * Handles localStorage persistence and system preference detection
 */
export function useTheme(): UseThemeReturn {
    const [theme, setTheme] = useState<Theme | null>(null);
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const initializeTheme = () => {
            try {
                const savedTheme = localStorage.getItem('theme') as Theme | null;
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                // Priority: 1) Saved preference, 2) System preference
                const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

                setTheme(initialTheme);
                setMounted(true);
                document.documentElement.classList.toggle('dark', initialTheme === 'dark');
            } catch (error) {
                // Fallback if localStorage is not available (e.g., incognito mode)
                console.warn('Could not access localStorage:', error);
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const fallbackTheme = systemPrefersDark ? 'dark' : 'light';
                setTheme(fallbackTheme);
                setMounted(true);
                document.documentElement.classList.toggle('dark', fallbackTheme === 'dark');
            }
        };

        initializeTheme();
    }, []);

    const toggleTheme = () => {
        if (!theme) return;

        const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');

        try {
            localStorage.setItem('theme', newTheme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    };

    return {
        theme,
        mounted,
        toggleTheme,
    };
}
