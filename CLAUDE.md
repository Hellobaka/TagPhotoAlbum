# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TagPhotoAlbum is a Vue.js photo management application with tagging, categorization, and search capabilities. Built with Vue 3, Pinia state management, Material Design 3 components, and an Express.js backend.

## Development Commands

- `npm run dev` - Start Vite development server on port 3000 (with proxy to backend at localhost:5085)
- `npm run build` - Build production assets (set `VITE_API_BASE_URL` and `VITE_HMAC_KEY` env vars first)
- `npm run preview` - Preview production build
- `npm run serve` - Start Express.js server (serves built frontend)

**Environment Variables:**
- `VITE_API_BASE_URL` - Backend API base URL (defaults to http://localhost:5085)
- `VITE_HMAC_KEY` - HMAC signature key for authentication (must match backend)

## Architecture

### Core Technologies
- **Frontend**: Vue 3 with Composition API
- **State Management**: Pinia stores (authStore, photoStore, notificationStore, themeStore)
- **Routing**: Vue Router with authentication guards
- **UI**: Material Web Components (MDC) - custom elements prefixed with `md-`
- **Build Tool**: Vite with custom element configuration for MDC

### Key Directories
- `src/stores/` - Pinia stores for authentication, photos, and notifications
- `src/components/` - Reusable Vue components
- `src/views/` - Page-level components (Home, Login)
- `src/api/photoApi.js` - Axios-based API client with JWT token injection
- `src/config/` - Configuration files (api.js, upload.js)
- `src/utils/` - Utility composables and helpers

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
│       └── UploadZone (Drag & Drop Upload)
└── GlobalSnackbar (Notifications)
```

## Key Implementation Details

### Material Web Components
- Custom elements configured in Vite config: `tag.startsWith('md-')`
- Components imported selectively in `src/main.js` for bundle optimization
- Note: `datalist` not supported with MDC text fields - use custom autocomplete

### Authentication Flow
1. Login with username/password or passkey (WebAuthn)
2. Password hashed with SHA-256, request signed with HMAC-SHA256
3. JWT token stored in localStorage via `src/utils/storage.js`
4. Token automatically injected into API requests via Axios interceptor
5. Route guards protect authenticated routes (check `src/router/index.js`)

### Data Loading Pattern
- **Pagination**: Photos loaded in pages of 20 via `photoStore.loadFirstPage()` and `loadMorePhotos()`
- **Infinite Scroll**: Intersection Observer triggers `loadMorePhotos()` when scrolling to bottom
- **On-Demand Filter Data**: Tags/folders/locations load only when sidebar expands
- **Image URLs**: All resolved through `getImageUrl()` function in API config

### State Management Conventions
- photoStore handles all photo CRUD, filtering, pagination, and upload operations
- Use `setLoadingState(type, isLoading)` for loading states
- Use `useNotificationStore().showError()` for error display
- Call `initTagsData()` before accessing tags data

### Tab Navigation System
- **Recommend**: AI-recommended photos with exclusion support
- **Tags**: Tag-based filtering with color coding
- **Folders**: Folder-based organization
- **Locations**: Location-based filtering
- **Uncategorized**: Photos needing categorization (uses separate pagination state)

### Upload Configuration
- Timeout calculated per image: `fileCount * TIMEOUT_PER_IMAGE` (10s per image)
- Min: 30s, Max: 5 minutes (configured in `src/config/upload.js`)
- Max concurrent uploads: 5 files

### Backend Integration
- Backend project: [TagPhotoAlbum.Server](https://github.com/Hellobaka/TagPhotoAlbum.Server)
- API prefix: `/api`
- Upload endpoint: `/external` (proxied in development)
- Default backend: http://localhost:5085