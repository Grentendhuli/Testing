/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LandlordBot UX Spec design tokens - Light theme first
        lb: {
          base:    'var(--lb-base)',     // page background
          surface: 'var(--lb-surface)',   // card background
          border:  'var(--lb-border)',    // card border
          muted:   'var(--lb-muted)',     // subtle surface
          elevated: 'var(--lb-elevated)', // elevated surface
          hover:   'var(--lb-hover)',     // hover state
          text: {
            primary:   'var(--lb-text-primary)',
            secondary: 'var(--lb-text-secondary)',
            muted:     'var(--lb-text-muted)',
            disabled:  'var(--lb-text-disabled)',
          },
          green:  '#22C55E',   // healthy state
          orange: '#F59E0B',   // warning state (amber accent)
          red:    '#EF4444',   // urgent state
          blue:   '#3B82F6',   // informational
          ring: {
            green:  { from: '#22C55E', to: '#16A34A' },
            yellow: { from: '#F59E0B', to: '#D97706' },
            red:    { from: '#EF4444', to: '#DC2626' },
          }
        },
        // Extended slate scale for theming
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Premium amber/gold accents - primary brand color
        amber: {
          450: '#f59e0b',
          550: '#d97706',
        },
        // Emergency rust/red
        rust: {
          450: '#dc2626',
          550: '#b91c1c',
        },
        // Semantic color tokens for consistent theming
        semantic: {
          // Background colors
          bg: {
            primary: 'var(--lb-base)',
            secondary: 'var(--lb-surface)',
            tertiary: '#f9fafb',
            elevated: 'var(--lb-elevated)',
          },
          // Text colors
          text: {
            primary: 'var(--lb-text-primary)',
            secondary: 'var(--lb-text-secondary)',
            tertiary: 'var(--lb-text-muted)',
            muted: 'var(--lb-text-disabled)',
          },
          // Border colors
          border: {
            DEFAULT: 'var(--lb-border)',
            subtle: '#f1f5f9',
            strong: '#cbd5e1',
          },
          // Accent colors
          accent: {
            DEFAULT: '#f59e0b',   // amber-500
            hover: '#d97706',     // amber-600
            subtle: '#fef3c7',    // amber-100
            muted: 'rgba(245, 158, 11, 0.1)',
          },
          // Status colors
          status: {
            success: '#10b981',   // emerald-500
            warning: '#f59e0b',   // amber-500
            error: '#ef4444',     // red-500
            info: '#3b82f6',      // blue-500
          }
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'ring-fill': 'ringFill 1.2s ease-out forwards',
        'fade-up':   'fadeUp 0.4s ease-out both',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        ringFill: {
          '0%':   { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--ring-offset)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
