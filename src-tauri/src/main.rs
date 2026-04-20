#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audit;
mod commands;
mod db;
mod error;
mod models;
mod report;

use db::DbState;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::io::Read;
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
    let validated_dir = validate_directory_path(&dest_dir)?;
    let db_path = state.db_path().to_path_buf();

    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("hms_backup_{}.db", timestamp);
    let dest_path = validated_dir.join(&backup_name);

    let dst = dest_path.clone();
    let db = db_path.clone();
    let result = tokio::task::spawn_blocking(move || {
        std::fs::copy(&db, &dst).map_err(|e| e.to_string())?;

        let checksum = compute_checksum(&dst)?;
        let checksum_file = dst.with_extension("db.sha256");
        std::fs::write(&checksum_file, checksum).map_err(|e| e.to_string())?;

        Ok::<String, String>(dst.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))??;

    Ok(result)
}

fn compute_checksum(path: &Path) -> Result<String, String> {
    let mut file = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];
    loop {
        let bytes_read = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn perform_auto_backup(db_path: &Path, backup_dir: &Path) -> Result<(), String> {
    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("hms_backup_{}.db", timestamp);
    let dest_path = backup_dir.join(&backup_name);

    std::fs::copy(db_path, &dest_path).map_err(|e| e.to_string())?;

    let checksum = compute_checksum(&dest_path)?;
    let checksum_file = dest_path.with_extension("db.sha256");
    std::fs::write(&checksum_file, checksum).map_err(|e| e.to_string())?;

    Ok(())
}

fn validate_backup_path(raw_path: &str) -> Result<PathBuf, String> {
    let path = Path::new(raw_path);

    for component in path.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("Path traversal detected: '..' is not allowed".to_string());
        }
    }

    match path.extension().and_then(|e| e.to_str()) {
        Some("db") | Some("sqlite") | Some("db.sh256") => {}
        _ => {
            return Err("Backup file must have .db or .sqlite extension".to_string());
        }
    }

    if !path.exists() {
        return Err("Backup file does not exist".to_string());
    }

    std::fs::canonicalize(path)
        .map_err(|e| format!("Cannot resolve backup path: {}", e))
}

#[tauri::command]
async fn restore_database(
    _state: tauri::State<'_, DbState>,
    backup_path: String,
) -> Result<String, String> {
    let validated_path = validate_backup_path(&backup_path)?;

    let checksum = compute_checksum(&validated_path)?;

    let checksum_file = validated_path.with_extension("db.sha256");
    if checksum_file.exists() {
        let stored_checksum = std::fs::read_to_string(&checksum_file)
            .map_err(|e| format!("Failed to read checksum file: {}", e))?
            .trim()
            .to_string();
        if stored_checksum != checksum {
            return Err("Checksum verification failed - backup file may be corrupted".to_string());
        }
    }

    Ok(format!("Backup verified successfully. SHA256: {}", checksum))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub database: String,
    pub version: String,
    pub uptime_seconds: u64,
}

fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn health_check(
    _state: tauri::State<'_, DbState>,
) -> Result<HealthStatus, String> {
    Ok(HealthStatus {
        status: "healthy".to_string(),
        database: "ok".to_string(),
        version: get_app_version(),
        uptime_seconds: 0,
    })
}

fn rotate_old_backups(backup_dir: &Path) -> Result<(), String> {
    let entries = std::fs::read_dir(backup_dir).map_err(|e| e.to_string())?;
    let mut backups: Vec<_> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().extension().map(|ext| ext == "db").unwrap_or(false)
        })
        .collect();

    backups.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    for backup in backups.iter().skip(7) {
        let _ = std::fs::remove_file(backup.path());
        let checksum_path = backup.path().with_extension("db.sha256");
        let _ = std::fs::remove_file(checksum_path);
    }

    Ok(())
}

#[tauri::command]
async fn get_backup_status(
    _state: tauri::State<'_, DbState>,
    backup_dir: String,
) -> Result<String, String> {
    let validated_dir = validate_directory_path(&backup_dir)?;

    let entries = std::fs::read_dir(&validated_dir).map_err(|e| e.to_string())?;
    let count = entries.count();

    Ok(format!("{} backup(s) found", count))
}

#[tokio::main]
async fn main() {
    let db_state = DbState::default();

    if let Err(e) = db_state.init().await {
        eprintln!("Failed to initialize database: {}", e);
        std::process::exit(1);
    }

    let backup_dir = std::env::var("HMS_BACKUP_DIR");
    if let Ok(dir) = backup_dir {
        let db_path = db_state.db_path().to_path_buf();
        let validated_dir = validate_directory_path(&dir);

        if let Ok(validated) = validated_dir {
            tokio::spawn(async move {
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;

                    if let Err(e) = perform_auto_backup(&db_path, &validated) {
                        eprintln!("Auto-backup failed: {}", e);
                    } else if let Err(e) = rotate_old_backups(&validated) {
                        eprintln!("Backup rotation failed: {}", e);
                    }
                }
            });
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_dialog::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_patients,
            commands::get_patients_paginated,
            commands::search_patients,
            commands::upsert_patient,
            commands::delete_patient,
            commands::get_appointments,
            commands::get_appointments_paginated,
            commands::upsert_appointment,
            commands::delete_appointment,
            commands::get_staff,
            commands::get_staff_paginated,
            commands::upsert_staff,
            commands::delete_staff,
            commands::get_inventory_items,
            commands::get_inventory_paginated,
            commands::upsert_inventory_item,
            commands::delete_inventory_item,
            report::generate_report,
            backup_database,
            restore_database,
            get_backup_status,
            health_check,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
