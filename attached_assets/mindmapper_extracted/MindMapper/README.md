# Mapa - 3D Mind Maps Made Simple

**A free app made by Kaci Bedi**  
*Mind maps but make it 3D*

Mapa is a production-quality 2D mind mapping web application that offers an innovative, interactive visualization platform for complex thought processes and knowledge management.

## ✨ Features

- **Interactive Mind Mapping**: Create and navigate through interconnected nodes in 2D space
- **God Mode**: Toggle to fractal/radial view for exploring entire mind map trees
- **Authentication Gate**: Email signup or Instagram follow (@Kaciibedi) required before access
- **Command Palette**: Quick navigation and actions with ⌘K
- **Import/Export**: Save and share your mind maps with floppy disk save icon
- **Light/Dark Mode**: Complete theming system with smooth transitions
- **Local Storage**: Offline-first with persistent data storage
- **60fps Performance**: Smooth canvas rendering and physics-based layouts
- **Mobile Support**: Touch-friendly controls and responsive design

## 🚀 Deployment to GitHub Pages

This app can be deployed to GitHub Pages as an extension of kacibedi.com. Here's how:

### Quick Deploy Steps

1. **Create Repository**: Upload all project files to your GitHub repository
2. **Enable GitHub Pages**: Go to Settings → Pages → Set source to "GitHub Actions"
3. **Auto Deploy**: Push to main branch triggers automatic deployment
4. **Access**: Your app will be live at `https://kacibedi.com/mapa/`

### Files Included for Deployment

- `.github/workflows/deploy.yml` - GitHub Actions workflow for automatic deployment
- `DEPLOYMENT.md` - Detailed deployment instructions
- `build-frontend.js` - Frontend-only build script
- Complete React + TypeScript + Canvas application

### Build Commands

```bash
# Development
npm run dev

# Production build (full-stack)
npm run build

# Frontend-only build for GitHub Pages
cd client && npm run build
```

## 🛠 Technical Stack

- **Frontend**: React 18 with TypeScript using Vite
- **2D Rendering**: HTML5 Canvas with custom rendering engine  
- **Physics**: d3-force-3d running in Web Workers
- **State**: Zustand with reactive updates
- **UI**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS with OKLCH color space
- **Storage**: Dexie (IndexedDB) for offline persistence
- **Authentication**: Local storage-based gate

## 📱 User Experience

- **Chrome-free interface** with breadcrumb navigation
- **Color synchronization** using golden angle distribution
- **Keyboard shortcuts** with comprehensive command palette  
- **Touch-friendly** mobile controls
- **Real-time feedback** for all interactions
- **Import/export** functionality for data portability

## 🔧 Development

Built on Replit with production-ready architecture:
- Type-safe development with full TypeScript
- Hot module replacement for instant updates
- Optimized bundle splitting and lazy loading
- Web Worker physics for 60fps performance
- Comprehensive error handling and validation

## 🎨 Design Philosophy

Minimalist UX focused on the mind mapping experience:
- Branded as "A free app made by Kaci Bedi"
- Tagline: "Mind maps but make it 3D"
- Authentication requiring email/Instagram engagement
- Clean interface with contextual controls only
- Smooth animations and visual feedback

---

Ready to deploy to kacibedi.com/mapa/ - just push to your GitHub repository!