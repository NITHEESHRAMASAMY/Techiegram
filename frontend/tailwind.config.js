export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0F19',        // Deep carbon space background
          card: '#161F30',      // Sleek navy-slate card
          accent: '#00F2FE',    // Tech Cyan
          purple: '#A020F0',    // Coding purple
          pink: '#FF007F',      // Highlight pink
          gray: '#8C9CB2',      // Muted developer gray
          border: '#243249',    // High-fidelity border
          hover: '#1F2B42',     // Hover state card
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        code: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.8))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
