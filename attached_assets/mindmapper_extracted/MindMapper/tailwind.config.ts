import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Base colors
        background: "hsl(var(--background-light))",
        foreground: "hsl(var(--foreground-light))",
        surface: "hsl(var(--surface-light))",
        
        // Semantic colors
        primary: "hsl(var(--accent-primary))",
        secondary: "hsl(var(--accent-secondary))",
        accent: "hsl(var(--accent-primary))",
        muted: "hsl(var(--muted-light))",
        border: "hsl(var(--border-light))",
        
        // Interactive states
        hover: "hsl(var(--hover-light))",
        
        // Status colors
        success: "hsl(var(--accent-secondary))",
        warning: "hsl(var(--accent-warning))",
        danger: "hsl(var(--accent-danger))",
        
        // Lattice specific colors
        'lattice-bg-light': '#f8fafc',
        'lattice-bg-dark': '#0b0f14',
        'lattice-surface-light': '#ffffff',
        'lattice-surface-dark': '#1a1f2e',
        'lattice-accent': '#3b82f6',
        
        // Maintain compatibility with existing shadcn components
        card: {
          DEFAULT: "hsl(var(--surface-light))",
          foreground: "hsl(var(--foreground-light))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface-light))",
          foreground: "hsl(var(--foreground-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--accent-danger))",
          foreground: "hsl(0 0% 98%)",
        },
        input: "hsl(var(--border-light))",
        ring: "hsl(var(--accent-primary))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn var(--animation-fast) ease-out",
        "slide-up": "slideInFromBottom var(--animation-normal) ease-out",
        "pulse-gentle": "pulseGentle 2s infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInFromBottom: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Add custom plugin for dark mode variables
    function({ addBase, theme }: any) {
      addBase({
        ':root': {
          '--background-light': '248 20% 97%',
          '--background-dark': '217 33% 7%',
          '--surface-light': '0 0% 100%',
          '--surface-dark': '217 22% 17%',
          '--foreground-light': '217 25% 12%',
          '--foreground-dark': '248 10% 92%',
          '--muted-light': '217 10% 45%',
          '--muted-dark': '217 10% 65%',
          '--accent-primary': '217 91% 60%',
          '--accent-primary-dark': '217 91% 55%',
          '--accent-secondary': '142 76% 36%',
          '--accent-warning': '43 96% 56%',
          '--accent-danger': '0 84% 60%',
          '--border-light': '217 20% 91%',
          '--border-dark': '217 20% 20%',
          '--hover-light': '217 20% 96%',
          '--hover-dark': '217 20% 12%',
          '--radius': '0.5rem',
        },
        '.dark': {
          '--background': 'var(--background-dark)',
          '--foreground': 'var(--foreground-dark)',
          '--surface': 'var(--surface-dark)',
          '--muted': 'var(--muted-dark)',
          '--border': 'var(--border-dark)',
          '--hover': 'var(--hover-dark)',
          '--accent-primary': 'var(--accent-primary-dark)',
        }
      });
    }
  ],
} satisfies Config;
