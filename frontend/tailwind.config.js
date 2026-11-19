/** Design tokens taken from the Fluento Figma file */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#faf8ff', ink: '#131b2e', muted: '#434655',
        brand: { DEFAULT: '#2563eb', dark: '#004ac6', tint: '#dbe1ff', soft: '#eaedff', wash: '#f2f3ff' },
        mint: { DEFAULT: '#89f5e7', dark: '#006058', ink: '#00201d' },
        line: '#dfe3f5',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['Geist', 'ui-monospace', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 1px rgba(0,0,0,0.05), 0 1px 8px rgba(19,27,46,0.04)',
        lift: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'none' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(37,99,235,.45)' }, '100%': { boxShadow: '0 0 0 22px rgba(37,99,235,0)' } },
      },
      animation: { rise: 'rise .5s ease-out both', pulseRing: 'pulseRing 1.4s ease-out infinite' },
    },
  },
  plugins: [],
};
