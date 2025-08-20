# Overview

Mapa is a production-quality 2D mind-mapping web application built with Vite, React, TypeScript, and Canvas rendering. Branded as "A free app made by Kaci Bedi" with the tagline "Mind maps but make it 3D", it features a minimalist design that allows users to create and navigate through interconnected nodes in 2D space with an authentication gate requiring either email signup or Instagram follow (@Kaciibedi) before accessing the app. Each node acts as a "space" that can be drilled into, creating hierarchical mind maps with fluid 60fps performance. The application uses canvas rendering for 2D visualization, d3-force-3d for physics-based layout, and includes features like color-synchronized node relationships, command palette navigation, import/export functionality with floppy disk icon, comprehensive light/dark mode theming, and persistent local storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **2D Rendering**: HTML5 Canvas with custom rendering engine for 2D visualization
- **Physics/Layout**: d3-force-3d running in Web Workers for performance
- **State Management**: Zustand with subscribeWithSelector middleware for reactive state updates
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom design tokens and OKLCH color space support
- **Client Storage**: Dexie (IndexedDB wrapper) for persistent local data storage
- **Authentication**: Local storage-based auth gate with email/Instagram options

## Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Development**: Vite middleware integration for hot module replacement
- **Storage Interface**: Abstracted storage layer with in-memory fallback for development

## Data Model Design
- **Node Structure**: Hierarchical nodes with parent-child relationships and additional user-defined links
- **Color System**: OKLCH color space with golden angle-based color generation for visual hierarchy
- **Positioning**: 3D coordinates with physics-based layout using force simulation
- **Persistence**: Local-first approach with IndexedDB for offline capability

## Performance Optimizations
- **Instanced Rendering**: Three.js instancing for handling thousands of nodes efficiently
- **Web Workers**: Layout calculations run in separate thread to maintain 60fps
- **Selective Rendering**: Only visible nodes and their immediate neighbors are rendered
- **Debounced Operations**: Database saves are debounced to prevent excessive writes

## User Interface Design
- **Authentication Gate**: Modal overlay requiring email signup or Instagram follow (@Kaciibedi) before app access
- **Minimalist UX**: Chrome-free interface with only breadcrumb navigation and command palette
- **Light/Dark Mode**: Complete theming system with toggle button in bottom-left, current scheme is dark mode
- **Mobile Support**: Touch-friendly controls with context sheets for mobile devices
- **Keyboard Navigation**: Comprehensive keyboard shortcuts with ⌘K command palette
- **Import/Export**: Full mind map data export with floppy disk save icon and custom naming
- **Real-time Feedback**: Immediate visual feedback for all interactions

## Color Synchronization System
- **Accent Inheritance**: Child nodes inherit colors from parents with perceptual spacing
- **Golden Angle Distribution**: Uses φ = 137.508° for optimal color distribution
- **OKLCH Color Space**: Perceptually uniform color adjustments for lightness and chroma
- **Visual Hierarchy**: Color relationships reinforce the hierarchical structure

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: react, react-dom, @types/react for the frontend framework
- **Three.js Stack**: three, @react-three/fiber, @react-three/drei for 3D rendering and utilities
- **Build Tools**: vite, typescript, @vitejs/plugin-react for development and building

## Database and Storage
- **PostgreSQL**: @neondatabase/serverless for cloud database connectivity
- **ORM**: drizzle-orm, drizzle-kit for type-safe database operations and migrations
- **Local Storage**: dexie for client-side IndexedDB operations

## UI and Styling
- **Component Library**: @radix-ui/* components for accessible UI primitives
- **Styling**: tailwindcss, postcss, autoprefixer for utility-first CSS
- **Icons**: lucide-react for consistent iconography
- **Fonts**: Google Fonts integration for typography

## Physics and Layout
- **Force Simulation**: d3-force-3d for physics-based node positioning
- **Color Processing**: culori for OKLCH color space operations
- **Search**: fuse.js for fuzzy search functionality

## Development Tools
- **Type Checking**: @types/node, @types/three for TypeScript definitions
- **Development**: @replit/* plugins for Replit integration
- **State Management**: zustand for client-side state management
- **Form Handling**: react-hook-form, @hookform/resolvers for form validation

## Performance and User Experience
- **Query Management**: @tanstack/react-query for server state management
- **Date Handling**: date-fns for date manipulation utilities
- **Utilities**: clsx, class-variance-authority for conditional styling
- **Command Interface**: cmdk for command palette functionality