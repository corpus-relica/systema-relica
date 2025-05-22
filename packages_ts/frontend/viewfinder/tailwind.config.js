/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            fontSize: '0.8125rem',
            lineHeight: '1.3',
            fontWeight: '300',
            fontFamily: '"IBM Plex Sans", sans-serif',
            
            // Links
            a: {
              color: '#90CAF9', // Light blue
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            
            // Paragraphs
            p: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            
            // Headings
            h1: {
              fontSize: '1.125rem',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h2: {
              fontSize: '1rem',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h3: {
              fontSize: '0.9375rem',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h4: {
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            
            // Lists
            ul: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              paddingLeft: '0.75rem',
            },
            ol: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              paddingLeft: '0.75rem',
            },
            li: {
              marginTop: '0.125rem',
              marginBottom: '0.125rem',
            },
            
            // Code blocks
            pre: {
              backgroundColor: '#1E1E1E', // Dark gray
              color: '#E9E9E9', // Light gray
              borderRadius: '0.25rem',
              padding: '0.375rem',
              overflowX: 'auto',
              fontSize: '0.75rem',
              fontFamily: '"IBM Plex Mono", monospace',
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              lineHeight: '1.2',
            },
            
            // Inline code
            code: {
              color: '#90CAF9', // Light blue
              backgroundColor: '#1E1E1E', // Dark gray
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '300',
              fontSize: '0.75rem',
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: '-0.01em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            
            // Tables
            table: {
              fontSize: '0.75rem',
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              fontFamily: '"IBM Plex Sans", sans-serif',
            },
            thead: {
              backgroundColor: '#1E1E1E', // Dark gray
            },
            th: {
              padding: '0.2rem',
              textAlign: 'left',
              fontWeight: '400',
              borderWidth: '1px',
              borderColor: '#333333',
            },
            td: {
              padding: '0.2rem',
              borderWidth: '1px',
              borderColor: '#333333',
            },
            
            // Blockquotes
            blockquote: {
              borderLeftWidth: '2px',
              borderLeftColor: '#90CAF9', // Light blue
              paddingLeft: '0.5rem',
              fontStyle: 'italic',
              color: '#BBBBBB', // Light gray
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              fontSize: '0.8125rem',
            },
            
            // Horizontal rule
            hr: {
              borderColor: '#333333',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
          },
        },
        // Add a specific variant for the invert (dark mode)
        invert: {
          css: {
            color: '#E9E9E9', // Light gray
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontWeight: '300',
            a: {
              color: '#90CAF9', // Light blue
            },
            h1: {
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h2: {
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h3: {
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            h4: {
              color: '#90CAF9', // Light blue
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
            code: {
              color: '#90CAF9', // Light blue
              backgroundColor: '#1E1E1E', // Dark gray
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: '300',
              letterSpacing: '-0.01em',
            },
            pre: {
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.75rem',
              lineHeight: '1.2',
            },
            blockquote: {
              borderLeftColor: '#90CAF9', // Light blue
              color: '#BBBBBB', // Light gray
              fontStyle: 'italic',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
}