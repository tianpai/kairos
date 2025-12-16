# Kairos

AI-powered resume optimization desktop application.

## Project Structure

```
kairos/
├── src/
│   ├── main/          # Electron main process (IPC handlers, Prisma, services)
│   ├── preload/       # Electron preload scripts (IPC bridge)
│   └── renderer/      # Frontend - React + Vite
├── prisma/            # Database schema and migrations
├── build/             # App icons for packaging
└── electron.vite.config.ts
```

## Prerequisites

- Node.js (v18+)
- npm

## Setup

Install dependencies:
```bash
npm install
```

## Development

Start the Electron app in development mode:
```bash
npm run dev
```

This single command:
- Builds the main and preload processes
- Starts the Vite dev server for the renderer (hot reload)
- Launches the Electron window with DevTools

## Production Build

Build and package the application for distribution:

```bash
# Build for macOS only
npm run build:mac

# Build for Windows only
npm run build:win

# Build for Linux only
npm run build:linux

# Build for all platforms
npm run build:all
```

Output will be in the `dist/` directory.

## Clean Build

Remove build artifacts and user data for a fresh start:

```bash
rm -rf dist/ out/ ~/Library/Application\ Support/kairos/
```

- `dist/` - packaged app output
- `out/` - compiled source
- `~/Library/Application Support/kairos/` - user data (database, settings)

## Database

The application uses **SQLite** for local storage via Prisma ORM:
- Development: `prisma/dev.db`
- Production: `<user-data>/kairos.db` (automatically created on first run)

## Key Architectural Principles

- **Desktop-First**: Single-user Electron application with local SQLite database
- **IPC Communication**: Main process handles database and system operations, renderer handles UI
- **Real-Time Preview**: Live preview compiles [Typst](https://typst.app/) code using WASM in the renderer process
- **Resume Templates**: Templates are generated programmatically using Typst
- **AI Workflows**: Web Worker-based AI services using OpenAI SDK

## Tech Stack

**Frontend (Renderer):**
- React 19 + TypeScript
- TanStack Router + Query
- Tailwind CSS
- Typst WASM compiler

**Main Process:**
- Electron
- Prisma ORM + SQLite
- electron-vite for build tooling
- electron-store for settings
