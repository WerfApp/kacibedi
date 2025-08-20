# Deploy Mapa to GitHub Pages

This guide explains how to deploy Mapa as an extension of your existing kacibedi.com GitHub Pages site.

## Prerequisites

- Your existing GitHub repository for kacibedi.com must have GitHub Pages enabled
- The repository should have GitHub Actions enabled

## Setup Steps

### 1. Create Repository
Create a new GitHub repository for Mapa or use a separate branch in your existing kacibedi.com repository.

### 2. Upload Code
Upload all the Mapa project files to your GitHub repository:
- Copy all files from this Replit project to your GitHub repository
- Make sure the `.github/workflows/deploy.yml` file is included

### 3. Configure GitHub Pages
In your GitHub repository settings:
1. Go to Settings → Pages
2. Set Source to "GitHub Actions" 
3. Save the settings

### 4. Deploy
Once you push code to the main branch, GitHub Actions will automatically:
1. Build the frontend application
2. Deploy it to GitHub Pages
3. Make it available at `https://kacibedi.com/mapa/`

## Manual Build (Optional)

To build locally before deployment:

```bash
npm install
cd client
npm run build
```

The built files will be in `client/dist/` ready for deployment.

## Domain Integration

After successful deployment, your Mapa app will be available at:
- `https://kacibedi.com/mapa/` (main app)
- `https://yourusername.github.io/repository-name/` (if using separate repository)

## Features

The deployed version includes:
- ✅ Authentication gate (email/Instagram)  
- ✅ Mind mapping with canvas rendering
- ✅ God Mode (toggle in bottom-left)
- ✅ Light/Dark theme toggle
- ✅ Import/Export functionality
- ✅ Command palette (⌘K)
- ✅ Local storage persistence
- ✅ Responsive design

## Troubleshooting

If deployment fails:
1. Check GitHub Actions logs in the Actions tab
2. Verify all npm dependencies are in package.json
3. Ensure build command works locally
4. Check that GitHub Pages is enabled in repository settings

The app is designed to work entirely in the browser with local storage, so no backend deployment is needed.