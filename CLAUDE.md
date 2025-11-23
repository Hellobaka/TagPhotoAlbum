# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TagPhotoAlbum is a Vue.js photo management application with tagging, categorization, and search capabilities. Built with Vue 3, Pinia state management, Material Design 3 components, and an Express.js backend.

## Development Commands

### Frontend Development
- `npm run dev` - Start Vite development server on port 3000 (with proxy to backend)
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
- **Backend**: Express.js with mock data (backend not included in this repository)

### Key Directories
- `src/stores/` - Pinia stores for authentication, photos, and notifications
- `src/components/` - Reusable Vue components
- `src/views/` - Page-level components
- `src/api/` - Axios-based API client
- `src/router/` - Vue Router configuration
- `src/config/` - Configuration files (API endpoints, etc.)

### State Management Pattern
- **authStore**: JWT authentication, login/logout, route guards, passkey management
- **photoStore**: Photo CRUD operations, tagging, filtering, search, pagination
- **notificationStore**: Global snackbar notifications
- **themeStore**: Theme management (light/dark mode)

### API Integration
- Centralized API client in `src/api/photoApi.js`
- Automatic JWT token injection via Axios interceptors
- Consistent error handling and authentication failure redirects
- Passkey authentication support

### Component Hierarchy
```
App
├── RouterView
│   ├── Login (Authentication)
│   └── Home (Main Application)
│       ├── Sidebar (Navigation & Filtering)
│       ├── FilterStatus (Active Filters)
│       ├── PhotoGrid (Masonry Layout with Infinite Scroll)
│       ├── PhotoDialog (Detail & Edit)
│       ├── CategorizeDialog (Batch Editing)
│       ├── UploadZone (Drag & Drop Upload)
│       └── Passkey Management Components
└── GlobalSnackbar (Notifications)
```

## Key Features

### Photo Management
- Masonry grid layout with progressive loading and infinite scroll
- Tag-based organization with color coding
- Folder and location categorization
- Search and filtering capabilities
- Batch editing and categorization
- Drag-and-drop file upload

### UI/UX
- Material Design 3 theming with light/dark mode support
- Responsive design with mobile support
- Smooth animations and transitions
- Color-coded tag system with dynamic color assignment

### Authentication
- JWT-based authentication with localStorage
- Passkey authentication support
- Route guards for protected pages
- Automatic token refresh handling

### Performance Optimizations
- **Lazy Loading**: Photos load in pages of 20, with Intersection Observer for infinite scroll
- **On-Demand Data**: Filter data loads only when sidebar is expanded and tab is active
- **Image Optimization**: Progressive loading with fallback to original images
- **Build Optimization**: Vite configured with manual chunk splitting

## Development Notes

### Material Web Components
- Custom elements are configured in Vite config (`tag.startsWith('md-')`)
- Use Material Design 3 components for consistent UI
- Note: `datalist` not supported with MDC text fields, use custom autocomplete

### API Configuration
- Backend configuration in `src/config/api.js`
- Proxy configuration in Vite config for development
- Image URL resolution through `getImageUrl()` function

### State Management
- Use Pinia stores for all state management
- Follow reactive patterns with Vue 3 Composition API
- Handle loading states consistently across components
- Tab switching triggers data refresh for up-to-date content

### Tab Navigation System
- **Recommend**: AI-recommended photos with exclusion support
- **Tags**: Tag-based filtering with color coding
- **Folders**: Folder-based organization
- **Locations**: Location-based filtering
- **Uncategorized**: Photos needing categorization with batch editing

### Image Handling
- All image URLs pass through `getImageUrl()` function
- Supports: full URLs, relative paths, data URLs
- Configurable backend address for deployment flexibility
- Progressive loading with loading states and error handling

### Recent Updates (Last Updated: 2025-11-23)

#### Lazy Loading & Performance
- **Pagination**: All tab pages load only first page (20 photos)
- **Infinite Scroll**: Automatic loading of next pages when scrolling to bottom
- **On-Demand Filter Data**: Sidebar filter data loads only when needed
- **Global Refresh**: Refresh button with visual feedback and success notifications

#### Authentication Enhancements
- **Passkey Support**: WebAuthn authentication with passkey management
- **Improved Security**: HMAC-based authentication with configurable keys
- **Token Validation**: Automatic token validation and refresh

#### UI/UX Improvements
- **Mobile Optimization**: Sidebar displays as overlay on mobile devices
- **Color-Coded Tags**: Dynamic color assignment for better visual organization
- **Enhanced Editing**: Improved tag and folder editing in category editor
- **Upload Experience**: Drag-and-drop upload with visual feedback

#### Configuration Management
- **Centralized Config**: Backend address and API configuration in one location
- **Easy Deployment**: Simple configuration changes for different environments
- **Proxy Setup**: Development proxy configured for backend communication

### Additional Development Information

#### File Structure
- `src/` - Main source code directory
- `src/assets/` - Static assets (CSS, images)
- `src/components/` - Vue components
- `src/config/` - Configuration files
- `src/stores/` - Pinia stores
- `src/views/` - Page components
- `src/router/` - Routing configuration
- `src/api/` - API client
- `src/utils/` - Utility functions

#### Key Components
- **PhotoGrid.vue**: Main photo display component with masonry layout
- **Sidebar.vue**: Navigation and filtering sidebar
- **PhotoDialog.vue**: Photo detail and editing modal
- **CategorizeDialog.vue**: Batch categorization interface
- **UploadZone.vue**: Drag-and-drop upload area
- **FilterStatus.vue**: Active filter display

#### Authentication Flow
1. Login with username/password or passkey
2. JWT token stored in localStorage
3. Token automatically added to API requests
4. Route guards protect authenticated routes
5. Token validation and refresh handled automatically

#### Data Loading Strategy
- **Lazy Loading**: Photos loaded in pages of 20
- **Infinite Scroll**: Next page loaded when user scrolls to bottom
- **Filter Data**: Loaded on-demand when sidebar is expanded
- **Recommendations**: AI-recommended photos with exclusion support

#### Performance Considerations
- Images are progressively loaded with placeholders
- Components are optimized for rendering performance
- State management is centralized to prevent inconsistencies
- API calls are batched and cached where appropriate

### Environment Variables
- `VITE_API_BASE_URL`: Backend API base URL (defaults to http://localhost:5085)
- `VITE_HMAC_KEY`: HMAC signature key for authentication (should match backend)

### Build Process
- Vite build with manual chunk splitting for optimized bundles
- Rollup configuration separates vendor libraries from application code
- Development proxy configured for API requests during development