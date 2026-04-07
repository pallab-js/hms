# GEMINI Context: HMS (Hospital Management System)

This project is a **local-first**, privacy-focused desktop application for managing hospital operations, built with **Tauri**, **Next.js**, and **Rust**. It follows a minimalist, grayscale design system inspired by Ollama.

## 🏗️ Architecture Overview

- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, TanStack Query, Lucide React.
- **Backend:** Rust, Tauri v2, SQLx (SQLite), `lopdf` (PDF generation).
- **Database:** Local SQLite database with migrations managed by SQLx.
- **State Management:** TanStack Query for server-state synchronization with the Rust backend.
- **Local-First:** All data remains on the user's machine; no external cloud dependencies.

## 📁 Project Structure

```text
hms/
├── src/                # Next.js Frontend
│   ├── app/            # App Router pages and layouts
│   ├── components/     # React components (AppShell, Providers, UI)
│   ├── lib/            # Frontend logic
│   │   └── api.ts      # Tauri invoke wrappers & TypeScript interfaces
│   └── globals.css     # Tailwind v4 configuration
├── src-tauri/          # Rust Backend
│   ├── src/
│   │   ├── main.rs     # Entry point & Tauri setup
│   │   ├── commands.rs # Tauri command implementations (CRUD)
│   │   ├── db.rs       # SQLite connection & migration logic
│   │   ├── models.rs   # Shared data structures (structs)
│   │   ├── report.rs   # PDF generation logic
│   │   └── error.rs    # Centralized error handling
│   ├── migrations/     # SQL migration files
│   └── Cargo.toml      # Backend dependencies
└── package.json        # Frontend dependencies & scripts
```

## 🚀 Key Commands

### Development
- `npm run dev`: Run Next.js frontend in the browser (for UI/UX work).
- `npm run tauri:dev`: Run the full desktop application (Frontend + Rust Backend).
- `cd src-tauri && cargo check`: Fast Rust type checking.

### Build
- `npm run build`: Build the Next.js frontend.
- `npm run tauri:build`: Build the production-ready desktop installer.

## 🎨 Design System (Ollama-inspired)

- **Palette:** Strictly grayscale. Pure White (`#ffffff`), Pure Black (`#000000`), and various shades of Gray.
- **Geometry:** Pill-shaped interactive elements (9999px radius). 12px radius for containers.
- **Typography:** SF Pro Rounded for headings, system sans-serif for body.
- **Shadows:** Zero shadows. Depth is achieved through borders (`1px solid #e5e5e5`) and background shifts.
- **Minimalism:** Low content density, generous whitespace, and zero chromatic color (except focus rings).

## 🛠️ Development Conventions

- **Tauri Commands:** All commands should return `Result<T, AppError>` and be registered in `src-tauri/src/main.rs`.
- **Database:** Use `sqlx` for queries. Avoid `!` macros to ensure compatibility without a fixed `DATABASE_URL` at compile time.
- **Data Models:** Sync Rust structs in `models.rs` with TypeScript interfaces in `api.ts`.
- **Validation:** Perform input validation in both the frontend (UI feedback) and backend (`commands.rs` helpers).
- **Error Handling:** Use the `AppError` enum in `src-tauri/src/error.rs` for consistent error reporting to the frontend.

## 📋 Features Implementation Status

- [x] **Patient Management:** Full CRUD.
- [x] **Appointment Scheduling:** Full CRUD with foreign key checks.
- [x] **Staff Directory:** Full CRUD.
- [x] **Inventory Tracking:** Full CRUD with low-stock logic.
- [x] **PDF Reports:** Implemented using `lopdf`.
- [x] **Database Backup:** Safe database file copying with path traversal protection.
- [x] **Dark Mode:** Persisted theme switching.
