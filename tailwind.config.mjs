/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          on: {
            DEFAULT: "var(--color-primary-on)",
            alt: "var(--color-primary-on-alt)",
          },
          variant: {
            DEFAULT: "var(--color-primary-variant)",
            on: "var(--color-primary-variant-on)",
          },
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          on: {
            DEFAULT: "var(--color-secondary-on)",
            alt: "var(--color-secondary-on-alt)",
          },
          variant: {
            DEFAULT: "var(--color-secondary-variant)",
            on: "var(--color-secondary-variant-on)",
          },
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          on: "var(--color-accent-on)",
        },
        background: {
          DEFAULT: "var(--color-background)",
          on: "var(--color-background-on)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          secondary: "var(--color-surface-secondary)",
          on: {
            DEFAULT: "var(--color-surface-on)",
            alt: "var(--color-surface-on-alt)",
          },
        },
        error: {
          DEFAULT: "var(--color-error)",
          on: "var(--color-error-on)",
        },
        gray: {
          DEFAULT: "var(--color-gray)",
          on: {
            DEFAULT: "var(--color-gray-on)",
            alt: "var(--color-gray-on-alt)",    // gray-out text
          },
        }
      },
    },
  },
}

