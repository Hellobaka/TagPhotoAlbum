# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TagPhotoAlbum is a Vue.js photo management application with tagging, categorization, and search capabilities. Built with Vue 3, Pinia state management, Material Design 3 components, and an Express.js backend.

## Development Commands

### Frontend Development
- `npm run dev` - Start Vite development server on port 3000
- `npm run build` - Build production assets
- `npm run preview` - Preview production build

### Full Application
- `npm run serve` - Start Express.js server (serves built frontend)

## Architecture

### Core Technologies
- **Frontend**: Vue 3 with Composition API
- **State Management**: Pinia stores
- **Routing**: Vue Router with authentication guards
- **UI**: Material Web Components (MDC) - custom elements prefixed with `md-`
- **Build Tool**: Vite with custom element configuration for MDC
- **Backend**: Express.js with mock data

### Key Directories
- `src/stores/` - Pinia stores for authentication, photos, and notifications
- `src/components/` - Reusable Vue components
- `src/views/` - Page-level components
- `src/api/` - Axios-based API client
- `src/router/` - Vue Router configuration
- `server/` - Express.js backend with REST API

### State Management Pattern
- **authStore**: JWT authentication, login/logout, route guards
- **photoStore**: Photo CRUD operations, tagging, filtering, search
- **notificationStore**: Global snackbar notifications

### API Integration
- Centralized API client in `src/api/photoApi.js`
- Automatic JWT token injection via Axios interceptors
- Consistent error handling and authentication failure redirects

### Component Hierarchy
```
App
├── RouterView
│   ├── Login (Authentication)
│   └── Home (Main Application)
│       ├── Sidebar (Navigation & Filtering)
│       ├── FilterStatus (Active Filters)
│       ├── PhotoGrid (Masonry Layout)
│       ├── PhotoDialog (Detail & Edit)
│       └── CategorizeDialog (Batch Editing)
└── GlobalSnackbar (Notifications)
```

## Key Features

### Photo Management
- Masonry grid layout with progressive loading
- Tag-based organization with color coding
- Folder and location categorization
- Search and filtering capabilities
- Batch editing and categorization

### UI/UX
- Material Design 3 theming
- Responsive design with mobile support
- Smooth animations and transitions
- Drag-and-drop file upload
- Color-coded tag system

### Authentication
- JWT-based authentication with localStorage
- Route guards for protected pages
- Automatic token refresh handling

## Recent Updates (2025-10-18)

### Lazy Loading Implementation
- **Pagination**: Tags, folders, and locations pages now load only first page (20 photos)
- **Infinite Scroll**: Automatic loading of next pages when scrolling to bottom
- **Performance Optimization**: Reduced initial load time by loading data on-demand

### Refresh Functionality
- **Global Refresh Button**: Added refresh icon in header for all tab pages
- **Loading States**: Visual feedback with rotating animation during refresh
- **Success Notifications**: Green snackbar shows photo count after refresh

### Data Loading Optimization
- **Removed Bulk Loading**: Eliminated `initializeData()` function that loaded all data at once
- **On-Demand Loading**: Each tab loads only its required data
- **Sidebar Optimization**: Filter data loads only when sidebar is expanded and tab is active

### Folder Input Enhancement
- **Custom Autocomplete**: Replaced dropdown selectors with autocomplete text fields in both PhotoDialog and CategorizeDialog
- **Smart Suggestions**: Click to show folder suggestions, input to filter, click to select
- **Consistent UX**: Same autocomplete experience across all editing interfaces

### Image Path Resolution
- **Relative Path Support**: Backend returns relative paths like `upload/1.png`
- **Automatic Conversion**: Frontend automatically converts to full URLs using configuration
- **Smart Detection**: Handles full URLs, relative paths, and other formats

### Configuration Management
- **Centralized Config**: Created `src/config/api.js` for backend address management
- **Easy Deployment**: Modify backend address in one location for all components
- **Current Settings**:
  - `BASE_URL: 'http://localhost:5085'`
  - `API_PREFIX: '/api'`
  - `UPLOAD_PATH: '/upload'`

### Tab Navigation
- **Data Refresh**: Each tab switch now automatically refreshes data
- **Uncategorized Photos**: Uses dedicated `/photos/uncategorized` endpoint
- **Recommend Photos**: Uses dedicated `/photos/recommend` endpoint

## Development Notes

### Material Web Components
- Custom elements are configured in Vite config (`tag.startsWith('md-')`)
- Use Material Design 3 components for consistent UI
- Note: `datalist` not supported with MDC text fields, use custom autocomplete

### API Development
- Backend uses mock data for development
- RESTful endpoints for photo management
- CORS enabled for frontend-backend communication
- Image paths are relative and require frontend conversion

### State Updates
- Use Pinia stores for all state management
- Follow reactive patterns with Vue 3 Composition API
- Handle loading states consistently across components
- Tab switching triggers data refresh for up-to-date content
- Lazy loading uses pagination and Intersection Observer for infinite scroll

### Image Handling
- All image URLs pass through `getImageUrl()` function
- Supports: full URLs, relative paths, data URLs
- Configurable backend address for deployment flexibility

### Performance Optimizations
- **Lazy Loading**: Photos load in pages of 20, with infinite scroll
- **On-Demand Data**: Filter data loads only when needed
- **Efficient State**: Each tab manages its own loading and data
- **Refresh Optimization**: Global refresh button with visual feedback