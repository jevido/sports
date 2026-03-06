export default {
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,svelte}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          shadow: "hsl(var(--card-shadow))",
        },
        neon: {
          surface: "hsl(var(--neon-surface))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-card": "var(--gradient-card)",
        "gradient-accept": "var(--gradient-accept)",
        "gradient-reject": "var(--gradient-reject)",
        "gradient-primary": "var(--gradient-primary)",
        "gradient-neon": "var(--gradient-neon)",
        "gradient-quiz": "var(--gradient-quiz)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        glow: "var(--shadow-glow)",
        neon: "var(--shadow-neon)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "swipe-left": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateX(-100vw) rotate(-30deg)",
            opacity: "0",
          },
        },
        "swipe-right": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateX(100vw) rotate(30deg)",
            opacity: "0",
          },
        },
        "card-enter": {
          "0%": { transform: "scale(0.8) translateY(50px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "var(--shadow-glow)" },
          "50%": { boxShadow: "0 0 60px hsl(185 100% 50% / 0.5)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "neon-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 5px hsl(185 100% 50% / 0.3), inset 0 0 5px hsl(185 100% 50% / 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 20px hsl(185 100% 50% / 0.5), inset 0 0 10px hsl(185 100% 50% / 0.2)",
          },
        },
      },
      animation: {
        "swipe-left": "swipe-left 0.5s ease-in-out forwards",
        "swipe-right": "swipe-right 0.5s ease-in-out forwards",
        "card-enter": "card-enter 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
