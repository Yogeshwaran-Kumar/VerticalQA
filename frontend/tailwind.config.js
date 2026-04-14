/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    900: '#0c4a6e',
                },
                accent: {
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    900: '#4c1d95',
                },
                dark: {
                    surface: '#18181b',
                    panel: '#27272a',
                    border: '#3f3f46'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'ring-ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
