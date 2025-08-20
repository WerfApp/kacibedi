# REST Express Application

## Overview

This is a full-stack web application built with React frontend and Express.js backend. The application uses a modern tech stack including TypeScript, Tailwind CSS, and shadcn/ui components for the frontend, with Drizzle ORM for database operations and session management on the backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and build processes
- **Component Strategy**: Comprehensive UI component library using Radix UI primitives

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **Development**: Hot reload with tsx for TypeScript execution
- **API Design**: RESTful API structure with /api prefix for all routes

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Session Store**: PostgreSQL-based session persistence

### Project Structure
- **Monorepo Design**: Single repository with client, server, and shared directories
- **Shared Schema**: Common TypeScript types and database schema in shared directory
- **Build Process**: Separate build processes for frontend (Vite) and backend (esbuild)
- **Development Mode**: Concurrent development with Vite dev server and Express server

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **User Schema**: Basic user model with username/password authentication
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Connection**: Environment-based DATABASE_URL configuration

### UI and Styling
- **shadcn/ui**: Comprehensive component library built on Radix UI
- **Radix UI**: Low-level UI primitives for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI components

### Development Tools
- **Vite**: Frontend build tool and development server
- **esbuild**: Backend bundling for production builds
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database schema management and migrations

### State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema validation

### Build and Deployment
- **Replit Integration**: Specialized plugins for Replit development environment
- **Hot Module Replacement**: Development-time code updates
- **Production Build**: Optimized builds for both frontend and backend