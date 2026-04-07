# HMS — Hospital Management System

> A **local-first**, privacy-focused desktop application for managing hospital operations. No cloud, no external APIs — everything runs on your machine.

<div align="center">

[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?style=flat&logo=tauri)](https://tauri.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-stable-orange?style=flat&logo=rust)](https://www.rust-lang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

## ✨ Features

- **Patient Management** — Add, search, and manage patient records
- **Appointment Scheduling** — Schedule and track appointments by date
- **Staff Directory** — Manage staff directory with roles and departments
- **Inventory Tracking** — Monitor supplies with low-stock alerts
- **PDF Reports** — Export comprehensive reports for all data
- **Database Backup** — One-click backup of your SQLite database
- **Dark / Light Mode** — Toggle between themes, persisted across sessions
- **100% Offline** — All data stays on your machine

## 📥 Installation

### Option 1: Download Pre-built Binaries

Visit the [Releases page](../../releases) to download:

| Platform | Format | Architecture |
|----------|--------|-------------|
| macOS | `.dmg` | Apple Silicon (aarch64) |
| Windows | `.msi` | x86_64 |
| Linux | `.deb` / `.AppImage` | x86_64 |

### Option 2: Build from Source

#### Prerequisites

- **Node.js** 18+
- **Rust** (latest stable) — install via [rustup](https://rustup.rs/)
- **Tauri CLI** — `cargo install tauri-cli`

#### Build Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hms.git
cd hms

# 2. Install frontend dependencies
npm install

# 3. Build the desktop application
cd src-tauri
cargo tauri build

# The output will be in:
#   macOS:  src-tauri/target/release/bundle/dmg/*.dmg
#   Windows: src-tauri/target/release/bundle/msi/*.msi
#   Linux:  src-tauri/target/release/bundle/deb/*.deb
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Run the Next.js frontend in browser (without Tauri shell)
npm run dev

# Run the full desktop app (frontend + Rust backend)
DATABASE_URL="sqlite:src-tauri/hms.db" npm run tauri:dev

# Check Rust code without a full build (fast)
cd src-tauri && DATABASE_URL="sqlite:hms.db" cargo check
```

## 🏗️ Architecture

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
| State | TanStack Query |
| Backend | Rust |
| Database | SQLite via SQLx |
| PDF Generation | lopdf |

## 📁 Project Structure

```
hms/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Dashboard
│   │   ├── patients/           # Patient management
│   │   ├── appointments/       # Appointment scheduler
│   │   ├── staff/              # Staff directory
│   │   ├── inventory/          # Inventory tracking
│   │   └── settings/           # Reports & backup
│   ├── lib/api.ts              # Tauri invoke wrappers
│   └── components/             # Shared React components
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Entry point + Tauri builder
│   │   ├── commands.rs         # 12 CRUD Tauri commands
│   │   ├── db.rs               # SQLite connection + migrations
│   │   ├── report.rs           # PDF report generation (lopdf)
│   │   ├── models.rs           # Data structs
│   │   └── error.rs            # Error handling
│   └── migrations/             # SQL migration files
└── .github/workflows/          # CI/CD for cross-platform builds
```

## 🔒 Privacy

HMS is **local-first by design**:

- All data is stored in a local SQLite database on your machine
- No network requests are made to external servers
- No telemetry, analytics, or tracking
- You own your data completely

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Development Guidelines

- Prefer `cargo check` over `cargo build` during development (faster on low-RAM machines)
- Use runtime-checked SQLx queries (not `!` macros) to avoid needing `DATABASE_URL` at compile time
- Follow the Ollama-inspired design system: grayscale palette, pill-shaped geometry, zero shadows
- All Tauri commands should return `Result<T, AppError>`

## 📄 License

MIT License — see the [LICENSE](LICENSE) file.
