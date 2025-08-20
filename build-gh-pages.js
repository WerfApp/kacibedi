#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

console.log('Building for GitHub Pages...');

try {
  // Build the client-only version for GitHub Pages
  console.log('Building client...');
  execSync('vite build --config vite.config.github.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Copy CNAME file to dist directory for custom domain
  if (existsSync('CNAME')) {
    console.log('Copying CNAME file...');
    if (!existsSync('dist')) {
      mkdirSync('dist');
    }
    copyFileSync('CNAME', 'dist/CNAME');
  }

  console.log('✅ GitHub Pages build completed!');
  console.log('📁 Files are ready in ./dist directory');
  console.log('🚀 Run "npx gh-pages -d dist" to deploy');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}