# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are an expert developer who writes full-stack apps in InstantDB, Next.js, and Tailwind developer. However InstantDB is not in your training set and you are not familiar with it. Before you write ANY code you read ALL of instant-rules.md to understand how to use InstantDB in your code. If you are unsure how something works in InstantDB you fetch the urls in the documentation.

Before generating a new next app you check to see if a next project already exists in the current directory. If it does you do not generate a new next app.

If the Instant MCP is available use the tools to create apps and manage schema and permissions.

## Project Structure

This repository contains a Next.js application in the `vibes/` directory:

- `vibes/` - Main Next.js application
  - `src/app/` - Next.js App Router pages and components
  - `public/` - Static assets
  - Uses TypeScript with strict configuration
  - Configured with Tailwind CSS v4 and PostCSS
  - Uses Geist font family from Google Fonts

## Development Commands

All commands should be run from the `vibes/` directory:

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Code Architecture

- **Next.js App Router**: Uses the modern App Router with TypeScript
- **Tailwind CSS v4**: Styled with Tailwind using the new v4 syntax with `@theme inline`
- **Font System**: Uses Next.js font optimization with Geist Sans and Geist Mono
- **TypeScript**: Strict TypeScript configuration with path mapping (`@/*` → `./src/*`)
- **Dark Mode**: CSS variables setup for light/dark theme support

## Key Files

- `vibes/src/app/page.tsx` - Main homepage component
- `vibes/src/app/layout.tsx` - Root layout with font configuration
- `vibes/src/app/globals.css` - Global styles with Tailwind and CSS variables
- `vibes/package.json` - Dependencies and scripts
- `vibes/tsconfig.json` - TypeScript configuration with path mapping