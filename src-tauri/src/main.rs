#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod models;
mod report;

use db::DbState;
use std::path::{Path, PathBuf};

/// Validate that a directory path is safe (no traversal).
fn validate_directory_path(raw_path: &str) -> Result<PathBuf, String> {
    let path = Path::new(raw_path);

    for component in path.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("Path traversal detected: '..' is not allowed".to_string());
        }
    }

    // Create directory if it doesn't exist
    let resolved = std::fs::canonicalize(path)
        .or_else(|_| {
            std::fs::create_dir_all(path)
                .map_err(|e| format!("Cannot create directory: {}", e))?;
            std::fs::canonicalize(path)
                .map_err(|e| format!("Cannot resolve directory: {}", e))
        })?;

    // Verify it's actually a directory
    if !resolved.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    Ok(resolved)
}

#[tauri::command]
async fn backup_database(
    state: tauri::State<'_, DbState>,
    dest_dir: String,
) -> Result<String, String> {
    // Validate the destination directory
    let validated_dir = validate_directory_path(&dest_dir)?;

    // Get the database path from DbState
    let db_path = state.db_path().to_path_buf();

    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("hms_backup_{}.db", timestamp);
    let dest_path = validated_dir.join(&backup_name);

    // Copy the database file (non-blocking via spawn_blocking)
    let dst = dest_path.clone();
    tokio::task::spawn_blocking(move || {
        std::fs::copy(&db_path, &dst).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
    .map_err(|e| format!("Copy failed: {}", e))?;

    Ok(dest_path.to_string_lossy().to_string())
}

#[tokio::main]
async fn main() {
    let db_state = DbState::default();

    // Initialize database before starting Tauri
    if let Err(e) = db_state.init().await {
        eprintln!("Failed to initialize database: {}", e);
        std::process::exit(1);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_patients,
            commands::upsert_patient,
            commands::delete_patient,
            commands::get_appointments,
            commands::upsert_appointment,
            commands::delete_appointment,
            commands::get_staff,
            commands::upsert_staff,
            commands::delete_staff,
            commands::get_inventory_items,
            commands::upsert_inventory_item,
            commands::delete_inventory_item,
            report::generate_report,
            backup_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
