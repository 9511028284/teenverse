/** @type {import('tailwindcss').Config} */
export default {
  // Toggle dark mode manually using the 'class' strategy
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- 1. Custom Keyframes for Animations ---
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-2%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        }
      },
      // --- 2. Register Custom Animations ---
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'bounce-subtle': 'bounce-subtle 1s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      // --- 3. Custom Background Images (Optional for specific glows) ---
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}