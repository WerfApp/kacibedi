#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building Mapa frontend for GitHub Pages deployment...');

try {
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Build the client
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔨 Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Copy the built files to a deployment-ready folder
  const buildDir = path.resolve('client/dist');
  const deployDir = path.resolve('deploy');
  
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true });
  }
  fs.mkdirSync(deployDir);
  
  if (fs.existsSync(buildDir)) {
    execSync(`cp -r ${buildDir}/* ${deployDir}/`, { stdio: 'inherit' });
    console.log('✅ Frontend built successfully!');
    console.log(`📁 Deployment files ready in: ${deployDir}`);
    console.log('🌐 Ready for GitHub Pages deployment at kacibedi.com/mapa/');
  } else {
    console.error('❌ Build directory not found');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}