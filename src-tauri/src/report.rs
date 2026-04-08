use chrono::Local;
use lopdf::content::{Content, Operation};
use lopdf::{Dictionary, Document, Object, Stream, StringFormat};
use std::path::{Path, PathBuf};

use crate::db::DbState;
use crate::error::AppError;
use crate::models::*;
use tauri::State;

/// Validate the output PDF path: no traversal, must be .pdf, resolve to absolute.
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

    // Create parent directories if needed, then resolve
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| AppError::Validation(format!("Cannot create output directory: {}", e)))?;
    }

    path.canonicalize().or_else(|_| {
        // File doesn't exist yet; canonicalize parent instead
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
            // Return the intended path since we can't canonicalize a non-existent file
            Ok(path.to_path_buf())
        } else {
            path.canonicalize()
                .map_err(|e| AppError::Validation(format!("Cannot resolve output path: {}", e)))
        }
    })
}

macro_rules! op {
    ($ops:expr, $cmd:expr, [$($arg:expr),*]) => {
        $ops.push(Operation::new($cmd, vec![$($arg),*]));
    };
}

macro_rules! txt {
    ($s:expr) => {
        Object::String($s.as_bytes().to_vec(), StringFormat::Literal)
    };
}

macro_rules! nm {
    ($s:expr) => {
        Object::Name($s.as_bytes().to_vec())
    };
}

macro_rules! real {
    ($f:expr) => {
        Object::Real($f as f32)
    };
}

macro_rules! int {
    ($n:expr) => {
        Object::Integer($n)
    };
}

macro_rules! refs {
    ($id:expr) => {
        Object::Reference(($id.0, $id.1))
    };
}

macro_rules! arr {
    [$($e:expr),*] => {
        Object::Array(vec![$($e),*])
    };
}

macro_rules! dict {
    [$($k:expr => $v:expr),*] => {
        Object::Dictionary(Dictionary::from_iter(vec![$(($k, $v)),*]))
    };
}

macro_rules! set_font {
    ($ops:expr, $font:expr, $size:expr) => {
        op!($ops, "Tf", [nm!($font), real!($size)]);
    };
}

macro_rules! set_color {
    ($ops:expr, $r:expr, $g:expr, $b:expr) => {
        op!($ops, "rg", [real!($r), real!($g), real!($b)]);
    };
}

macro_rules! text_at {
    ($ops:expr, $x:expr, $y:expr) => {
        op!($ops, "Td", [real!($x), real!($y)]);
    };
}

macro_rules! text_out {
    ($ops:expr, $s:expr) => {
        op!($ops, "Tj", [txt!($s)]);
    };
}

/// Sanitize input for PDF content to prevent PDF structure corruption
/// Removes control characters and escapes special PDF characters
fn sanitize_for_pdf(input: &str) -> String {
    input
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .collect::<String>()
        .replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)")
}

macro_rules! begin_text {
    ($ops:expr) => {
        op!($ops, "BT", []);
    };
}

macro_rules! end_text {
    ($ops:expr) => {
        op!($ops, "ET", []);
    };
}

macro_rules! fill_rect {
    ($ops:expr, $x:expr, $y:expr, $w:expr, $h:expr) => {
        op!($ops, "re", [real!($x), real!($y), real!($w), real!($h)]);
        op!($ops, "f", []);
    };
}

/// Build PDF content operations (extracted for spawn_blocking).
fn build_pdf_content(
    patients: &[Patient],
    appointments: &[Appointment],
    staff_list: &[Staff],
    inventory: &[InventoryItem],
    now: &str,
) -> Result<(Content, Document), AppError> {
    let mut ops = Vec::new();
    let mut y = 710.0;

    // ─── Header ──────────────────────────────
    set_color!(ops, 0.035, 0.035, 0.035);
    fill_rect!(ops, 0.0, 752.0, 595.0, 40.0);

    begin_text!(ops);
    set_color!(ops, 1.0, 1.0, 1.0);
    set_font!(ops, "F1", 16.0);
    text_at!(ops, 30.0, 762.0);
    text_out!(ops, "HMS - Hospital Management System");
    end_text!(ops);

    begin_text!(ops);
    set_color!(ops, 0.7, 0.7, 0.7);
    set_font!(ops, "F2", 8.0);
    text_at!(ops, 30.0, 748.0);
    text_out!(ops, &format!("Report generated: {}", now));
    end_text!(ops);

    // ─── Summary ─────────────────────────────
    begin_text!(ops);
    set_color!(ops, 0.0, 0.0, 0.0);
    set_font!(ops, "F1", 12.0);
    text_at!(ops, 30.0, y);
    text_out!(ops, "Summary");
    end_text!(ops);
    y -= 18.0;

    begin_text!(ops);
    set_color!(ops, 0.45, 0.45, 0.45);
    set_font!(ops, "F2", 9.0);
    text_at!(ops, 30.0, y);
    text_out!(ops, &format!(
        "Patients: {}  |  Appointments: {}  |  Staff: {}  |  Inventory: {}",
        patients.len(),
        appointments.len(),
        staff_list.len(),
        inventory.len()
    ));
    end_text!(ops);
    y -= 20.0;

    // ─── Patient Directory ───────────────────
    set_color!(ops, 0.9, 0.9, 0.9);
    fill_rect!(ops, 15.0, y, 565.0, 0.5);
    y -= 18.0;

    begin_text!(ops);
    set_color!(ops, 0.0, 0.0, 0.0);
    set_font!(ops, "F1", 12.0);
    text_at!(ops, 30.0, y);
    text_out!(ops, "Patient Directory");
    end_text!(ops);
    y -= 18.0;

    begin_text!(ops);
    set_color!(ops, 0.0, 0.0, 0.0);
    set_font!(ops, "F1", 7.0);
    text_at!(ops, 30.0, y);
    text_out!(ops, "Name");
    text_at!(ops, 200.0, y);
    text_out!(ops, "Age");
    text_at!(ops, 240.0, y);
    text_out!(ops, "Gender");
    text_at!(ops, 300.0, y);
    text_out!(ops, "Phone");
    text_at!(ops, 430.0, y);
    text_out!(ops, "Email");
    end_text!(ops);
    y -= 12.0;

    // Limit to 25 rows per page to prevent overflow
    for p in patients.iter().take(25) {
        let email = p.email.as_deref().unwrap_or("---");
        begin_text!(ops);
        set_color!(ops, 0.45, 0.45, 0.45);
        set_font!(ops, "F2", 7.0);
        text_at!(ops, 30.0, y);
        text_out!(ops, &sanitize_for_pdf(&p.name));
        text_at!(ops, 200.0, y);
        text_out!(ops, &p.age.to_string());
        text_at!(ops, 240.0, y);
        text_out!(ops, &sanitize_for_pdf(&p.gender));
        text_at!(ops, 300.0, y);
        text_out!(ops, &sanitize_for_pdf(&p.phone));
        text_at!(ops, 430.0, y);
        text_out!(ops, &sanitize_for_pdf(email));
        end_text!(ops);
        y -= 11.0;
        if y < 50.0 {
            break;
        }
    }

    // ─── Staff Directory ─────────────────────
    if y > 60.0 {
        y -= 5.0;
        set_color!(ops, 0.9, 0.9, 0.9);
        fill_rect!(ops, 15.0, y, 565.0, 0.5);
        y -= 18.0;

        begin_text!(ops);
        set_color!(ops, 0.0, 0.0, 0.0);
        set_font!(ops, "F1", 12.0);
        text_at!(ops, 30.0, y);
        text_out!(ops, "Staff Directory");
        end_text!(ops);
        y -= 18.0;

        begin_text!(ops);
        set_color!(ops, 0.0, 0.0, 0.0);
        set_font!(ops, "F1", 7.0);
        text_at!(ops, 30.0, y);
        text_out!(ops, "Name");
        text_at!(ops, 200.0, y);
        text_out!(ops, "Role");
        text_at!(ops, 340.0, y);
        text_out!(ops, "Department");
        text_at!(ops, 470.0, y);
        text_out!(ops, "Phone");
        end_text!(ops);
        y -= 12.0;

        for s in staff_list.iter().take(20) {
            begin_text!(ops);
            set_color!(ops, 0.45, 0.45, 0.45);
            set_font!(ops, "F2", 7.0);
            text_at!(ops, 30.0, y);
            text_out!(ops, &sanitize_for_pdf(&s.name));
            text_at!(ops, 200.0, y);
            text_out!(ops, &sanitize_for_pdf(&s.role));
            text_at!(ops, 340.0, y);
            text_out!(ops, &sanitize_for_pdf(&s.department));
            text_at!(ops, 470.0, y);
            text_out!(ops, &sanitize_for_pdf(&s.phone));
            end_text!(ops);
            y -= 11.0;
            if y < 50.0 {
                break;
            }
        }
    }

    // ─── Inventory Overview ──────────────────
    if y > 60.0 {
        y -= 5.0;
        set_color!(ops, 0.9, 0.9, 0.9);
        fill_rect!(ops, 15.0, y, 565.0, 0.5);
        y -= 18.0;

        begin_text!(ops);
        set_color!(ops, 0.0, 0.0, 0.0);
        set_font!(ops, "F1", 12.0);
        text_at!(ops, 30.0, y);
        text_out!(ops, "Inventory Overview");
        end_text!(ops);
        y -= 18.0;

        begin_text!(ops);
        set_color!(ops, 0.0, 0.0, 0.0);
        set_font!(ops, "F1", 7.0);
        text_at!(ops, 30.0, y);
        text_out!(ops, "Item");
        text_at!(ops, 200.0, y);
        text_out!(ops, "Category");
        text_at!(ops, 340.0, y);
        text_out!(ops, "Qty");
        text_at!(ops, 390.0, y);
        text_out!(ops, "Unit");
        text_at!(ops, 440.0, y);
        text_out!(ops, "Min");
        text_at!(ops, 490.0, y);
        text_out!(ops, "Status");
        end_text!(ops);
        y -= 12.0;

        for item in inventory.iter().take(20) {
            let status = if item.quantity <= item.min_quantity {
                "LOW"
            } else {
                "OK"
            };
            begin_text!(ops);
            set_color!(ops, 0.45, 0.45, 0.45);
            set_font!(ops, "F2", 7.0);
            text_at!(ops, 30.0, y);
            text_out!(ops, &sanitize_for_pdf(&item.name));
            text_at!(ops, 200.0, y);
            text_out!(ops, &sanitize_for_pdf(&item.category));
            text_at!(ops, 340.0, y);
            text_out!(ops, &item.quantity.to_string());
            text_at!(ops, 390.0, y);
            text_out!(ops, &sanitize_for_pdf(&item.unit));
            text_at!(ops, 440.0, y);
            text_out!(ops, &item.min_quantity.to_string());
            text_at!(ops, 490.0, y);
            text_out!(ops, status);
            end_text!(ops);
            y -= 11.0;
            if y < 50.0 {
                break;
            }
        }
    }

    // ─── Footer ──────────────────────────────
    begin_text!(ops);
    set_color!(ops, 0.7, 0.7, 0.7);
    set_font!(ops, "F2", 6.0);
    text_at!(ops, 30.0, 20.0);
    text_out!(
        ops,
        "HMS - Local-First Hospital Management System"
    );
    end_text!(ops);

    let content = Content { operations: ops };

    // ─── Build PDF document ──────────────────
    let mut doc = Document::with_version("1.7");

    let catalog_id = doc.new_object_id();
    let pages_id = doc.new_object_id();
    let page1_id = doc.new_object_id();
    let content_id = doc.new_object_id();
    let font_id = doc.new_object_id();

    let helvetica = dict!["Type" => nm!("Font"), "Subtype" => nm!("Type1"), "BaseFont" => nm!("Helvetica"), "Encoding" => nm!("WinAnsiEncoding")];
    let helvetica_oblique = dict!["Type" => nm!("Font"), "Subtype" => nm!("Type1"), "BaseFont" => nm!("Helvetica-Oblique"), "Encoding" => nm!("WinAnsiEncoding")];
    let font_dict = dict!["F1" => helvetica, "F2" => helvetica_oblique];
    let resources = dict!["Font" => refs!(font_id)];
    let catalog = dict!["Type" => nm!("Catalog"), "Pages" => refs!(pages_id)];
    let page = dict!["Type" => nm!("Page"), "Parent" => refs!(pages_id), "Contents" => refs!(content_id), "MediaBox" => arr![int!(0), int!(0), int!(595), int!(842)], "Resources" => resources];
    let pages = dict!["Type" => nm!("Pages"), "Kids" => arr![refs!(page1_id)], "Count" => int!(1)];

    doc.objects.insert(catalog_id, catalog);
    doc.objects.insert(pages_id, pages);
    doc.objects.insert(page1_id, page);
    doc.objects.insert(font_id, font_dict);

    // Content stream inserted last
    doc.objects.insert(content_id, Object::Stream(Stream::new(Dictionary::new(), content.encode().map_err(|e| AppError::Internal(e.to_string()))?)));

    doc.trailer.set("Root", refs!(catalog_id));

    Ok((content, doc))
}

#[tauri::command]
pub async fn generate_report(
    state: State<'_, DbState>,
    output_path: String,
) -> Result<String, AppError> {
    // Validate the output path BEFORE fetching data
    let validated_path = validate_pdf_path(&output_path)?;

    // Fetch data on the async thread
    let pool = state.get_pool().await;

    let patients = sqlx::query_as::<_, Patient>(
        "SELECT id, name, age, gender, phone, email, address, created_at, updated_at FROM patients ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let appointments = sqlx::query_as::<_, Appointment>(
        "SELECT id, patient_id, staff_id, title, description, scheduled_at, duration_minutes, status, created_at, updated_at FROM appointments ORDER BY scheduled_at"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let staff_list = sqlx::query_as::<_, Staff>(
        "SELECT id, name, role, department, phone, email, created_at, updated_at FROM staff ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let inventory = sqlx::query_as::<_, InventoryItem>(
        "SELECT id, name, category, quantity, unit, min_quantity, created_at, updated_at FROM inventory ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Offload PDF building and writing to a blocking thread
    let result = tokio::task::spawn_blocking(move || {
        let (_content, mut doc) = build_pdf_content(&patients, &appointments, &staff_list, &inventory, &now)?;
        doc.save(&validated_path)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        Ok::<String, AppError>(validated_path.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| AppError::Internal(format!("PDF task failed: {}", e)))??;

    Ok(result)
}
