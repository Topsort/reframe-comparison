# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a React + Vite application that compares AI image reframing capabilities between two models:
- FAL.AI's Image Editing API (`fal-ai/image-editing/reframe`)
- Ideogram V3 API (`fal-ai/ideogram/v3/reframe`)

The app consists of a React frontend and a simple Express backend for persisting generation history.

## Architecture

### Frontend (React + Vite)
- **Entry point**: `src/main.jsx` → `src/App.jsx`
- **Key components**: Single-page application with drag-and-drop image upload, dimension presets, and result comparison
- **State management**: React hooks (useState, useEffect) for local state
- **API integration**: Uses `@fal-ai/client` for AI model interactions
- **File handling**: `react-dropzone` for image uploads

### Backend (Express)
- **Server**: `server.js` - Simple Express server on port 3001
- **Endpoints**:
  - `GET /api/history` - Load generation history
  - `POST /api/history` - Save generation history
  - `GET /api/health` - Health check
- **Storage**: JSON file at `public/history.json`

### Key Data Flow
1. User uploads image → React dropzone handles file
2. User selects dimensions → App maps to API-compatible formats
3. Image uploaded to FAL.AI storage → Gets URL
4. Both APIs called in parallel with Promise.allSettled
5. Results displayed and saved to history via backend

## Development Commands

```bash
# Start both frontend and backend concurrently
npm run dev

# Start only frontend (Vite dev server)
npm run client

# Start only backend (Express server)
npm run server

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Configuration

### API Integration
- FAL.AI credentials are hardcoded in `App.jsx:61` (consider moving to environment variables)
- Vite proxy configuration in `vite.config.js` routes `/api` to backend

### Dimension Mapping
The app maps custom dimensions to API-compatible formats:
- **Image Editing API**: Uses aspect ratios (1:1, 16:9, 4:3, 3:4, 9:16, etc.)
- **Ideogram API**: Uses image sizes (square_hd, landscape_16_9, portrait_9_16, etc.)

Functions `getClosestAspectRatio()` and `getClosestImageSize()` in `App.jsx` handle this mapping.

## Key Files

- `package.json` - Dependencies and scripts for both frontend and backend
- `server.js` - Express backend for history persistence
- `src/App.jsx` - Main React component (515 lines)
- `vite.config.js` - Vite configuration with API proxy
- `eslint.config.js` - ESLint configuration

## Testing

No test framework is currently configured. Consider adding Vitest or Jest for testing.

## Notes

- The backend creates `public/history.json` for persistence
- Images are uploaded to FAL.AI's storage service and referenced by URL
- Both AI APIs are called concurrently using Promise.allSettled for better error handling
- History is automatically saved to backend on each generation