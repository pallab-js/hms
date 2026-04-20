use chrono::Local;
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;
use std::path::{Path, PathBuf};

use crate::db::DbState;
use crate::error::AppError;
use crate::models::*;
use tauri::State;

fn validate_pdf_path(raw: &str) -> Result<PathBuf, AppError> {
    let path = Path::new(raw);

    for component in path.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err(AppError::Validation(
                "Path traversal detected: '..' is not allowed".into(),
            ));
        }
    }

    match path.extension() {
        Some(ext) if ext.to_string_lossy().to_lowercase() == "pdf" => {}
        _ => {
            return Err(AppError::Validation(
                "Output file must have a .pdf extension".into(),
            ));
        }
    }

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| AppError::Validation(format!("Cannot create output directory: {}", e)))?;
    }

    path.canonicalize().or_else(|_| {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
            Ok(path.to_path_buf())
        } else {
            path.canonicalize()
                .map_err(|e| AppError::Validation(format!("Cannot resolve output path: {}", e)))
        }
    })
}

fn find_unicode_font() -> Option<PathBuf> {
    let font_candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/LucidaGrande.ttc",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/Library/Fonts/Arial.ttf",
        "/Library/Fonts/SF Pro Display.ttc",
    ];

    for candidate in font_candidates {
        let p = PathBuf::from(candidate);
        if p.exists() {
            return Some(p);
        }
    }
    None
}

fn is_invalid_pdf_char(c: char) -> bool {
    c.is_control() && c != '\n' && c != '\t'
}

fn sanitize_for_pdf(input: &str) -> String {
    input.chars().filter(|c| !is_invalid_pdf_char(*c)).collect()
}

fn build_pdf_content(
    patients: &[Patient],
    appointments: &[Appointment],
    staff_list: &[Staff],
    inventory: &[InventoryItem],
    now: &str,
) -> Result<Vec<u8>, AppError> {
    let (doc, page1, layer1) =
        PdfDocument::new("HMS Report", Mm(210.0), Mm(297.0), "Layer 1");

    let font_path = find_unicode_font().ok_or_else(|| {
        AppError::Internal("No suitable Unicode font found on system".into())
    })?;

    let font = doc
        .add_external_font(&mut File::open(&font_path).map_err(|e| {
            AppError::Internal(format!("Failed to open font file: {}", e))
        })?)
        .map_err(|e| AppError::Internal(format!("Failed to parse font: {}", e)))?;

    let font_small = doc
        .add_external_font(&mut File::open(&font_path).map_err(|e| {
            AppError::Internal(format!("Failed to open font file: {}", e))
        })?)
        .map_err(|e| AppError::Internal(format!("Failed to parse font: {}", e)))?;

    let current_layer = doc.get_page(page1).get_layer(layer1);

    current_layer.set_font(&font, 16.0);
    current_layer.set_font(&font_small, 9.0);

    let mut y = 280.0;

    current_layer.use_text("HMS - Hospital Management System", 16.0, Mm(10.0), Mm(y), &font);

    y -= 15.0;
    current_layer.set_font(&font_small, 8.0);
    current_layer.use_text(&format!("Report generated: {}", now), 8.0, Mm(10.0), Mm(y), &font_small);

    y -= 15.0;
    current_layer.set_font(&font, 12.0);
    current_layer.use_text("Summary", 12.0, Mm(10.0), Mm(y), &font);

    y -= 10.0;
    current_layer.set_font(&font_small, 9.0);
    current_layer.use_text(
        &format!(
            "Patients: {}  |  Appointments: {}  |  Staff: {}  |  Inventory: {}",
            patients.len(),
            appointments.len(),
            staff_list.len(),
            inventory.len()
        ),
        9.0,
        Mm(10.0),
        Mm(y),
        &font_small,
    );

    y -= 18.0;

    current_layer.use_text("Patient Directory", 12.0, Mm(10.0), Mm(y), &font);

    y -= 10.0;
    current_layer.set_font(&font_small, 7.0);
    current_layer.use_text("Name", 7.0, Mm(10.0), Mm(y), &font_small);
    current_layer.use_text("Age", 7.0, Mm(60.0), Mm(y), &font_small);
    current_layer.use_text("Gender", 7.0, Mm(75.0), Mm(y), &font_small);
    current_layer.use_text("Phone", 7.0, Mm(100.0), Mm(y), &font_small);
    current_layer.use_text("Email", 7.0, Mm(140.0), Mm(y), &font_small);

    y -= 8.0;

    for p in patients.iter().take(30) {
        if y < 20.0 {
            break;
        }

        let email = p.email.as_deref().unwrap_or("---");

        current_layer.use_text(&sanitize_for_pdf(&p.name), 7.0, Mm(10.0), Mm(y), &font_small);
        current_layer.use_text(&p.age.to_string(), 7.0, Mm(60.0), Mm(y), &font_small);
        current_layer.use_text(&sanitize_for_pdf(&p.gender), 7.0, Mm(75.0), Mm(y), &font_small);
        current_layer.use_text(&sanitize_for_pdf(&p.phone), 7.0, Mm(100.0), Mm(y), &font_small);
        current_layer.use_text(&sanitize_for_pdf(email), 7.0, Mm(140.0), Mm(y), &font_small);

        y -= 8.0;
    }

    y -= 10.0;
    if y > 40.0 {
        current_layer.use_text("Staff Directory", 12.0, Mm(10.0), Mm(y), &font);

        y -= 10.0;
        current_layer.set_font(&font_small, 7.0);
        current_layer.use_text("Name", 7.0, Mm(10.0), Mm(y), &font_small);
        current_layer.use_text("Role", 7.0, Mm(60.0), Mm(y), &font_small);
        current_layer.use_text("Department", 7.0, Mm(100.0), Mm(y), &font_small);
        current_layer.use_text("Phone", 7.0, Mm(150.0), Mm(y), &font_small);

        y -= 8.0;

        for s in staff_list.iter().take(15) {
            if y < 20.0 {
                break;
            }

            current_layer.use_text(&sanitize_for_pdf(&s.name), 7.0, Mm(10.0), Mm(y), &font_small);
            current_layer.use_text(&sanitize_for_pdf(&s.role), 7.0, Mm(60.0), Mm(y), &font_small);
            current_layer.use_text(&sanitize_for_pdf(&s.department), 7.0, Mm(100.0), Mm(y), &font_small);
            current_layer.use_text(&sanitize_for_pdf(&s.phone), 7.0, Mm(150.0), Mm(y), &font_small);

            y -= 8.0;
        }
    }

    y -= 10.0;
    if y > 40.0 {
        current_layer.use_text("Inventory Overview", 12.0, Mm(10.0), Mm(y), &font);

        y -= 10.0;
        current_layer.set_font(&font_small, 7.0);
        current_layer.use_text("Item", 7.0, Mm(10.0), Mm(y), &font_small);
        current_layer.use_text("Category", 7.0, Mm(60.0), Mm(y), &font_small);
        current_layer.use_text("Qty", 7.0, Mm(100.0), Mm(y), &font_small);
        current_layer.use_text("Unit", 7.0, Mm(130.0), Mm(y), &font_small);
        current_layer.use_text("Status", 7.0, Mm(160.0), Mm(y), &font_small);

        y -= 8.0;

        for item in inventory.iter().take(15) {
            if y < 20.0 {
                break;
            }

            let status = if item.quantity <= item.min_quantity {
                "LOW"
            } else {
                "OK"
            };

            current_layer.use_text(&sanitize_for_pdf(&item.name), 7.0, Mm(10.0), Mm(y), &font_small);
            current_layer.use_text(&sanitize_for_pdf(&item.category), 7.0, Mm(60.0), Mm(y), &font_small);
            current_layer.use_text(&item.quantity.to_string(), 7.0, Mm(100.0), Mm(y), &font_small);
            current_layer.use_text(&sanitize_for_pdf(&item.unit), 7.0, Mm(130.0), Mm(y), &font_small);
            current_layer.use_text(status, 7.0, Mm(160.0), Mm(y), &font_small);

            y -= 8.0;
        }
    }

    current_layer.set_font(&font_small, 6.0);
    current_layer.use_text(
        "HMS - Local-First Hospital Management System",
        6.0,
        Mm(10.0),
        Mm(10.0),
        &font_small,
    );

    let mut buffer = Vec::new();
    {
        let mut writer = BufWriter::new(&mut buffer);
        doc.save(&mut writer).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    Ok(buffer)
}

#[tauri::command]
pub async fn generate_report(
    state: State<'_, DbState>,
    output_path: String,
) -> Result<String, AppError> {
    let validated_path = validate_pdf_path(&output_path)?;

    let pool = state.get_pool().await;

    let patients = sqlx::query_as::<_, Patient>(
        "SELECT id, name, age, gender, phone, email, address, created_at, updated_at FROM patients ORDER BY name",
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let appointments = sqlx::query_as::<_, Appointment>(
        "SELECT id, patient_id, staff_id, title, description, scheduled_at, duration_minutes, status, created_at, updated_at FROM appointments ORDER BY scheduled_at",
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let staff_list = sqlx::query_as::<_, Staff>(
        "SELECT id, name, role, department, phone, email, created_at, updated_at FROM staff ORDER BY name",
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let inventory = sqlx::query_as::<_, InventoryItem>(
        "SELECT id, name, category, quantity, unit, min_quantity, created_at, updated_at FROM inventory ORDER BY name",
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let result = tokio::task::spawn_blocking(move || {
        let bytes = build_pdf_content(&patients, &appointments, &staff_list, &inventory, &now)?;
        std::fs::write(&validated_path, &bytes)
            .map_err(|e| AppError::Internal(format!("Failed to write PDF: {}", e)))?;
        Ok::<String, AppError>(validated_path.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| AppError::Internal(format!("PDF task failed: {}", e)))??;

    Ok(result)
}