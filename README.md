# Kaci Bedi - Personal Links Site

A minimalist personal links website featuring an ASCII fluid simulation background inspired by Hokusai's wave art style. Built with React, TypeScript, and Canvas-based particle physics.

## ✨ Features

- **ASCII Fluid Animation**: Dynamic water simulation that responds to button interactions
- **Hokusai-Inspired Design**: Dark terminal aesthetic with teal/cyan accents
- **Interactive Water Physics**: Water rises dramatically toward buttons when hovered
- **Ripple Effects**: Button clicks create beautiful ripple effects across the water surface
- **Personal Branding**: Features Rumi quote and social media links

## 🚀 GitHub Pages Deployment

This site is configured to automatically deploy to GitHub Pages from the `main` branch.

### Setup Instructions:

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Set Source to "GitHub Actions"
   
2. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy your site
   - Your site will be available at `https://yourusername.github.io/repository-name`

3. **Build locally (optional):**
   ```bash
   npm install
   npm run build
   ```
   - The built files will be in the `dist/` directory

### Technical Notes:

- The site is built as a static Single Page Application (SPA)
- Uses Vite for building and bundling
- All dependencies are frontend-only for GitHub Pages compatibility
- The ASCII water simulation runs entirely in the browser using Canvas API

## 🎨 Customization

The water animation and styling can be customized in:
- `client/src/pages/home.tsx` - Main component with water simulation
- `client/src/index.css` - Global styles and color scheme

## 🌊 Water Animation

The site features a sophisticated ASCII fluid simulation with:
- Real-time particle physics
- Mouse interaction and button attraction
- Dynamic ASCII character rendering based on water movement
- Velocity-based color changes
- Ripple effects on button interactions

Built with vanilla Canvas API and mathematical physics simulation for optimal performance.