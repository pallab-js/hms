# HMS — Hospital Management System

## Project Overview

HMS is a **local-first, privacy-focused desktop application** for managing hospital operations. Built with Tauri v2, it combines a Next.js 15 frontend with a Rust backend, storing all data in a local SQLite database. No cloud, no external APIs — everything runs on the user's machine.

### Core Features
- **Patient Management** — Add, edit, delete patient records
- **Appointment Scheduling** — Schedule and track appointments by date
- **Staff Directory** — Manage staff with roles and departments
- **Inventory Tracking** — Monitor supplies with low-stock alerts
- **PDF Reports** — Export comprehensive reports (lopdf-based)
- **Database Backup** — One-click SQLite backup
- **Dark / Light Mode** — Theme toggle, persisted via localStorage
- **100% Offline** — All data stays on the machine

### Architecture

```
┌──────────────────────────────────────────────────┐
│                   Tauri Shell                    │
│  ┌────────────────────────────────────────────┐  │
│  │              Next.js Frontend              │  │
│  │  (React + Tailwind + TanStack Query)       │  │
│  └──────────────────┬─────────────────────────┘  │
│                     │ Tauri invoke()              │
│  ┌──────────────────▼─────────────────────────┐  │
│  │               Rust Backend                 │  │
│  │  (SQLx + SQLite + lopdf PDF generation)    │  │
│  └──────────────────┬─────────────────────────┘  │
│                     │                             │
│  ┌──────────────────▼─────────────────────────┐  │
│  │              SQLite Database               │  │
│  │         (patients, appointments,           │  │
│  │          staff, inventory)                  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 |
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| State Management | TanStack Query |
| Backend | Rust |
| Database | SQLite via SQLx |
| PDF Generation | lopdf 0.34 |

---

## Building and Running

### Prerequisites
- **Node.js** 18+
- **Rust** (latest stable) — install via [rustup](https://rustup.rs/)
- **Tauri CLI** — `cargo install tauri-cli`

### Key Commands

```bash
# Install frontend dependencies
npm install

# Run Next.js frontend in browser (without Tauri shell)
npm run dev

# Run the full desktop app (frontend + Rust backend)
DATABASE_URL="sqlite:src-tauri/hms.db" npm run tauri:dev

# Build the desktop application for production
cd src-tauri
cargo tauri build

# Check Rust code without a full build (fast)
cd src-tauri && cargo check

# Run Rust tests
cd src-tauri && cargo test

# Run frontend tests
npm test

# TypeScript type checking
npx tsc --noEmit

# Lint frontend
npm run lint
```

### Output Locations (after build)
- **macOS:** `src-tauri/target/release/bundle/dmg/*.dmg`
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi`
- **Linux:** `src-tauri/target/release/bundle/deb/*.deb`

---

## Project Structure

```
hms/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── layout.tsx          # Root layout with QueryProvider + ThemeProvider
│   │   ├── page.tsx            # Dashboard (statistics + recent patients)
│   │   ├── globals.css         # Tailwind config + dark mode variant + typography
│   │   ├── patients/           # Patient management (CRUD + edit)
│   │   ├── appointments/       # Appointment scheduling (CRUD + edit)
│   │   ├── staff/              # Staff directory (CRUD + edit)
│   │   ├── inventory/          # Inventory tracking (CRUD + edit)
│   │   └── settings/           # PDF export + database backup
│   ├── lib/
│   │   ├── api.ts              # Tauri invoke() wrappers (14 functions)
│   │   └── bindings.ts         # Auto-generated TypeScript types from Rust (specta)
│   └── components/
│       ├── AppShell.tsx        # Layout shell with sidebar navigation
│       ├── ThemeProvider.tsx   # Dark/light theme context + localStorage persistence
│       └── QueryProvider.tsx   # TanStack Query client provider
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Entry point + Tauri builder + backup command
│   │   ├── commands.rs         # 12 CRUD Tauri commands + validation + sanitization
│   │   ├── db.rs               # SQLite connection pool + migrations
│   │   ├── report.rs           # PDF report generation (lopdf)
│   │   ├── models.rs           # Data structs (Patient, Appointment, Staff, Inventory)
│   │   └── error.rs            # AppError enum with safe serialization
│   ├── migrations/
│   │   └── 20260407000000_initial_schema.sql
│   ├── capabilities/
│   │   └── default.json        # Tauri permissions (core, dialog open/save)
│   ├── Cargo.toml
│   └── tauri.conf.json
└── [config files: tsconfig.json, next.config.ts, vitest.config.ts, etc.]
```

---

## Development Conventions

### Rust Backend

- **All Tauri commands** return `Result<T, AppError>` — never raw strings
- **Use `_inner` function pattern** for testability: each `#[tauri::command]` delegates to a `_inner` function that takes `&DbState` directly
- **Parameterized SQL queries only** — no string interpolation in SQL (SQL injection prevention)
- **Input sanitization** via `sanitize_text_input()` on all text fields (strips control characters, trims whitespace)
- **Email validation** uses `email_address` crate (RFC 5321 compliant)
- **Server-side ID generation** — clients cannot forge UUIDs (UUID v4)
- **Upsert pattern** — all INSERT use `ON CONFLICT(id) DO UPDATE SET`; if `id` is provided → UPDATE, if `id` is None → INSERT
- **Foreign key enforcement** enabled via `PRAGMA foreign_keys = ON`
- **Database errors suppressed** from frontend — only generic messages sent to client
- **Prefer `cargo check`** over `cargo build` during development (faster on low-RAM machines)
- **Use runtime-checked SQLx queries** (not `!` macros) to avoid needing `DATABASE_URL` at compile time

### Frontend (React/TypeScript)

- **"use client"** directive on all page components and shared components
- **TanStack Query** for all data fetching with 60s stale time and `refetchOnWindowFocus: false`
- **Mutation → invalidate → refetch** pattern for all CRUD operations
- **Form validation** on both frontend (before submit) and backend (before DB)
- **Numeric input validation** with proper range checks (age 0-150, duration 1-480, quantities ≥ 0)
- **Confirmation dialogs** on all delete operations with entity name in message
- **Edit functionality** — all entities support edit via optional `id` field in Create* interfaces

### Design System (Ollama-inspired)

The UI follows an Ollama-inspired design philosophy:

- **Pure grayscale palette** — no chromatic colors except focus ring blue (`#3b82f6`)
- **Binary border-radius system**: 12px (containers) or 9999px (everything interactive)
- **Zero shadows** — depth comes from borders and background shifts only
- **SF Pro Rounded** for display headings (weight 500), system sans-serif for body text
- **Only two font weights**: 400 (regular) for body, 500 (medium) for headings
- **Pill-shaped geometry** on all interactive elements

### Color Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary Text | `#000000` | `#ffffff` | Headlines, primary content |
| Secondary Text | `#737373` | `#a3a3a3` | Muted content, placeholders |
| Background | `#ffffff` | `#0a0a0a` | Page background |
| Surface | `#fafafa` | `#141414` | Cards, panels |
| Borders | `#e5e5e5` | `#262626` | Container borders |
| Button (CTA) | `#000000` | `#ffffff` | Primary actions (inverted in dark) |

### Testing Practices

- **Rust unit tests** cover all CRUD lifecycles (5 tests in `commands.rs`)
- **In-memory SQLite database** for testing (`DbState::init_test()`)
- **Frontend tests** via Vitest + Testing Library (component rendering tests)
- **TypeScript type checking** enforced (`npx tsc --noEmit`)

---

## Important Implementation Details

### Tauri Capabilities

The `src-tauri/capabilities/default.json` file must include URL scoping for dev mode:
```json
{
  "remote": {
    "urls": ["http://localhost:*", "https://localhost:*"]
  },
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### Dark Mode

Tailwind CSS v4 requires explicit dark mode variant in `src/app/globals.css`:
```css
@variant dark (&:where(.dark, .dark *));
```

### Database Path Resolution

The database path resolves in this order:
1. `DATABASE_URL` environment variable (strips `sqlite:` prefix)
2. Platform app data directory (`com.hms.app/hms.db`)
3. Current working directory (`hms.db`)

### Security Features

- SQL injection prevention (all queries parameterized)
- Input sanitization (control characters stripped)
- RFC 5321 email validation
- PDF content sanitization (special characters escaped)
- Path traversal prevention (`..` rejected)
- Server-side UUID generation
- Security headers configured (X-Frame-Options, CSP, etc.)

---

## Known Limitations

- **No pagination** — all records fetched at once (acceptable for local-first, but will degrade with >10k records)
- **No Unicode support in PDF** — lopdf uses WinAnsiEncoding (256 characters only)
- **No audit trail** — delete operations are permanent with no logging
- **No database encryption** — SQLite is plaintext (HIPAA/GDPR concern)
- **No multi-user support** — single-user desktop application
- **No backup restore** — only backup exists, no restore functionality
- **ESLint TypeScript parsing warnings** — non-blocking, configuration issue
