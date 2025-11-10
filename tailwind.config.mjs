/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
				display: ['Space Grotesk Variable', 'Space Grotesk', 'sans-serif'],
				mono: ['JetBrains Mono', 'Courier New', 'monospace'],
			},
			colors: {
				'sherlog-blue': '#1e40af', // blue-800 - accent color
			},
		},
	},
	plugins: [],
}
