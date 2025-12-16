# Renderer (Frontend)

## Description

React-based frontend that runs in the Electron renderer process.

## Tech Stack

- React 19
- Vite (dev server with hot reload)
- TanStack Router v1 (code-based routing)
- TanStack Query v5 (data fetching & caching)
- TailwindCSS v4
- TypeScript
- Typst WASM compiler (resume rendering)
- ESLint

## Key Features

- **Real-time Resume Preview**: Typst WASM compilation runs in the browser for instant updates
- **WebSocket Integration**: Live updates from backend AI tasks
- **Drag-and-Drop**: File uploads for resumes and job descriptions
- **Dynamic Form Builder**: Resume forms generated from Typst templates

## Setup

The renderer dependencies are automatically installed when you run `npm install` at the project root.

## Development

The renderer is automatically started by electron-vite during development:

```bash
# From project root
npm run dev
```

This starts:
- Vite dev server on port 5173
- Electron loads the renderer from http://localhost:5173

## Build

```bash
# From project root
npm run build
```

Outputs to: `out/renderer/`

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Check and fix both
npm run check
```

## API Integration

- Backend API: `http://localhost:3001` (proxied via `/api` in dev)
- WebSocket: Direct connection to backend WebSocket server
