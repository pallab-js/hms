use crate::db::DbState;
use crate::error::AppError;
use crate::models::*;
use tauri::State;
use uuid::Uuid;

// ─── Input Validation Helpers ──────────────────────────────

/// Maximum allowed lengths for text fields to prevent database bloat.
const MAX_NAME_LEN: usize = 255;
const MAX_PHONE_LEN: usize = 50;
const MAX_ADDRESS_LEN: usize = 500;
const MAX_TITLE_LEN: usize = 255;
const MAX_DESC_LEN: usize = 2000;
const MAX_ROLE_LEN: usize = 100;
const MAX_DEPT_LEN: usize = 100;
const MAX_CATEGORY_LEN: usize = 100;
const MAX_UNIT_LEN: usize = 50;

fn validate_uuid(id: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(id).map_err(|_| AppError::Validation("Invalid record ID format".into()))
}

fn validate_not_empty(s: &str, field: &str) -> Result<(), AppError> {
    if s.trim().is_empty() {
        Err(AppError::Validation(format!("{} is required", field)))
    } else {
        Ok(())
    }
}

fn validate_len(s: &str, max: usize, field: &str) -> Result<(), AppError> {
    if s.len() > max {
        Err(AppError::Validation(format!(
            "{} exceeds maximum length of {} characters",
            field, max
        )))
    } else {
        Ok(())
    }
}

fn validate_optional_len(s: &Option<String>, max: usize, field: &str) -> Result<(), AppError> {
    if let Some(ref val) = s {
        validate_len(val, max, field)
    } else {
        Ok(())
    }
}

fn validate_email(email: &Option<String>) -> Result<(), AppError> {
    if let Some(ref e) = email {
        if !e.is_empty() && (!e.contains('@') || !e.contains('.')) {
            return Err(AppError::Validation("Invalid email format".into()));
        }
    }
    Ok(())
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

// ─── Patients ──────────────────────────────────────────────

#[tauri::command]
pub async fn get_patients(state: State<'_, DbState>) -> Result<Vec<Patient>, AppError> {
    get_patients_inner(&state).await
}

pub async fn get_patients_inner(state: &DbState) -> Result<Vec<Patient>, AppError> {
    let pool = state.get_pool().await;
    let patients = sqlx::query_as::<_, Patient>(
        "SELECT id, name, age, gender, phone, email, address, created_at, updated_at FROM patients ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(patients)
}

#[tauri::command]
pub async fn upsert_patient(
    state: State<'_, DbState>,
    input: CreatePatient,
) -> Result<Patient, AppError> {
    upsert_patient_inner(&state, input).await
}

pub async fn upsert_patient_inner(
    state: &DbState,
    input: CreatePatient,
) -> Result<Patient, AppError> {
    validate_not_empty(&input.name, "Patient name")?;
    validate_len(&input.name, MAX_NAME_LEN, "Patient name")?;
    validate_len(&input.gender, MAX_NAME_LEN, "Gender")?;
    validate_len(&input.phone, MAX_PHONE_LEN, "Phone")?;
    validate_email(&input.email)?;
    validate_optional_len(&input.address, MAX_ADDRESS_LEN, "Address")?;

    if input.age < 0 || input.age > 150 {
        return Err(AppError::Validation("Age must be between 0 and 150".into()));
    }

    let pool = state.get_pool().await;
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let patient = sqlx::query_as::<_, Patient>(
        r#"
        INSERT INTO patients (id, name, age, gender, phone, email, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            age = excluded.age,
            gender = excluded.gender,
            phone = excluded.phone,
            email = excluded.email,
            address = excluded.address,
            updated_at = excluded.updated_at
        RETURNING id, name, age, gender, phone, email, address, created_at, updated_at
        "#,
    )
    .bind(&id)
    .bind(&input.name)
    .bind(input.age)
    .bind(&input.gender)
    .bind(&input.phone)
    .bind(&input.email)
    .bind(&input.address)
    .bind(&ts)
    .bind(&ts)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(patient)
}

#[tauri::command]
pub async fn delete_patient(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    delete_patient_inner(&state, id).await
}

pub async fn delete_patient_inner(state: &DbState, id: String) -> Result<(), AppError> {
    validate_uuid(&id)?;

    let pool = state.get_pool().await;
    let result = sqlx::query("DELETE FROM patients WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Patient with id {} not found", id)));
    }

    Ok(())
}

// ─── Appointments ──────────────────────────────────────────

#[tauri::command]
pub async fn get_appointments(state: State<'_, DbState>) -> Result<Vec<Appointment>, AppError> {
    let pool = state.get_pool().await;
    let appointments = sqlx::query_as::<_, Appointment>(
        "SELECT id, patient_id, staff_id, title, description, scheduled_at, duration_minutes, status, created_at, updated_at FROM appointments ORDER BY scheduled_at"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(appointments)
}

#[tauri::command]
pub async fn upsert_appointment(
    state: State<'_, DbState>,
    input: CreateAppointment,
) -> Result<Appointment, AppError> {
    upsert_appointment_inner(&state, input).await
}

pub async fn upsert_appointment_inner(
    state: &DbState,
    input: CreateAppointment,
) -> Result<Appointment, AppError> {
    validate_not_empty(&input.title, "Appointment title")?;
    validate_len(&input.title, MAX_TITLE_LEN, "Appointment title")?;
    validate_optional_len(&input.description, MAX_DESC_LEN, "Description")?;

    // Validate referenced records exist (FK check)
    let pool = state.get_pool().await;

    let patient_exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM patients WHERE id = ?"
    )
    .bind(&input.patient_id)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    if patient_exists.0 == 0 {
        return Err(AppError::Validation("Referenced patient does not exist".into()));
    }

    let staff_exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM staff WHERE id = ?"
    )
    .bind(&input.staff_id)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    if staff_exists.0 == 0 {
        return Err(AppError::Validation("Referenced staff member does not exist".into()));
    }

    let id = Uuid::new_v4().to_string();
    let ts = now();

    let appointment = sqlx::query_as::<_, Appointment>(
        r#"
        INSERT INTO appointments (id, patient_id, staff_id, title, description, scheduled_at, duration_minutes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            patient_id = excluded.patient_id,
            staff_id = excluded.staff_id,
            title = excluded.title,
            description = excluded.description,
            scheduled_at = excluded.scheduled_at,
            duration_minutes = excluded.duration_minutes,
            updated_at = excluded.updated_at
        RETURNING id, patient_id, staff_id, title, description, scheduled_at, duration_minutes, status, created_at, updated_at
        "#,
    )
    .bind(&id)
    .bind(&input.patient_id)
    .bind(&input.staff_id)
    .bind(&input.title)
    .bind(&input.description)
    .bind(&input.scheduled_at)
    .bind(input.duration_minutes)
    .bind(&ts)
    .bind(&ts)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(appointment)
}

#[tauri::command]
pub async fn delete_appointment(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    validate_uuid(&id)?;

    let pool = state.get_pool().await;
    let result = sqlx::query("DELETE FROM appointments WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Appointment with id {} not found", id)));
    }

    Ok(())
}

// ─── Staff ─────────────────────────────────────────────────

#[tauri::command]
pub async fn get_staff(state: State<'_, DbState>) -> Result<Vec<Staff>, AppError> {
    get_staff_inner(&state).await
}

pub async fn get_staff_inner(state: &DbState) -> Result<Vec<Staff>, AppError> {
    let pool = state.get_pool().await;
    let staff = sqlx::query_as::<_, Staff>(
        "SELECT id, name, role, department, phone, email, created_at, updated_at FROM staff ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(staff)
}

#[tauri::command]
pub async fn upsert_staff(
    state: State<'_, DbState>,
    input: CreateStaff,
) -> Result<Staff, AppError> {
    upsert_staff_inner(&state, input).await
}

pub async fn upsert_staff_inner(state: &DbState, input: CreateStaff) -> Result<Staff, AppError> {
    validate_not_empty(&input.name, "Staff name")?;
    validate_len(&input.name, MAX_NAME_LEN, "Staff name")?;
    validate_len(&input.role, MAX_ROLE_LEN, "Role")?;
    validate_len(&input.department, MAX_DEPT_LEN, "Department")?;
    validate_len(&input.phone, MAX_PHONE_LEN, "Phone")?;
    validate_email(&input.email)?;

    let pool = state.get_pool().await;
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let staff = sqlx::query_as::<_, Staff>(
        r#"
        INSERT INTO staff (id, name, role, department, phone, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            role = excluded.role,
            department = excluded.department,
            phone = excluded.phone,
            email = excluded.email,
            updated_at = excluded.updated_at
        RETURNING id, name, role, department, phone, email, created_at, updated_at
        "#,
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.role)
    .bind(&input.department)
    .bind(&input.phone)
    .bind(&input.email)
    .bind(&ts)
    .bind(&ts)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(staff)
}

#[tauri::command]
pub async fn delete_staff(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    delete_staff_inner(&state, id).await
}

pub async fn delete_staff_inner(state: &DbState, id: String) -> Result<(), AppError> {
    validate_uuid(&id)?;

    let pool = state.get_pool().await;
    let result = sqlx::query("DELETE FROM staff WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Staff member with id {} not found", id)));
    }

    Ok(())
}

// ─── Inventory ─────────────────────────────────────────────

#[tauri::command]
pub async fn get_inventory_items(state: State<'_, DbState>) -> Result<Vec<InventoryItem>, AppError> {
    get_inventory_items_inner(&state).await
}

pub async fn get_inventory_items_inner(state: &DbState) -> Result<Vec<InventoryItem>, AppError> {
    let pool = state.get_pool().await;
    let items = sqlx::query_as::<_, InventoryItem>(
        "SELECT id, name, category, quantity, unit, min_quantity, created_at, updated_at FROM inventory ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(items)
}

#[tauri::command]
pub async fn upsert_inventory_item(
    state: State<'_, DbState>,
    input: CreateInventoryItem,
) -> Result<InventoryItem, AppError> {
    upsert_inventory_item_inner(&state, input).await
}

pub async fn upsert_inventory_item_inner(
    state: &DbState,
    input: CreateInventoryItem,
) -> Result<InventoryItem, AppError> {
    validate_not_empty(&input.name, "Item name")?;
    validate_len(&input.name, MAX_NAME_LEN, "Item name")?;
    validate_len(&input.category, MAX_CATEGORY_LEN, "Category")?;
    validate_len(&input.unit, MAX_UNIT_LEN, "Unit")?;

    if input.quantity < 0 {
        return Err(AppError::Validation("Quantity must be non-negative".into()));
    }
    if input.min_quantity < 0 {
        return Err(AppError::Validation("Minimum quantity must be non-negative".into()));
    }

    let pool = state.get_pool().await;
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let item = sqlx::query_as::<_, InventoryItem>(
        r#"
        INSERT INTO inventory (id, name, category, quantity, unit, min_quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            category = excluded.category,
            quantity = excluded.quantity,
            unit = excluded.unit,
            min_quantity = excluded.min_quantity,
            updated_at = excluded.updated_at
        RETURNING id, name, category, quantity, unit, min_quantity, created_at, updated_at
        "#,
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.category)
    .bind(input.quantity)
    .bind(&input.unit)
    .bind(input.min_quantity)
    .bind(&ts)
    .bind(&ts)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(item)
}

#[tauri::command]
pub async fn delete_inventory_item(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    delete_inventory_item_inner(&state, id).await
}

pub async fn delete_inventory_item_inner(state: &DbState, id: String) -> Result<(), AppError> {
    validate_uuid(&id)?;

    let pool = state.get_pool().await;
    let result = sqlx::query("DELETE FROM inventory WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Inventory item with id {} not found", id)));
    }

    Ok(())
}

// ─── Tests ─────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::DbState;

    async fn setup_test_db() -> DbState {
        DbState::init_test().await
    }

    #[tokio::test]
    async fn test_upsert_patient_validation() {
        let state = setup_test_db().await;

        // Name is required
        let input = CreatePatient {
            name: "".into(),
            age: 30,
            gender: "Male".into(),
            phone: "123".into(),
            email: None,
            address: None,
        };
        let result = upsert_patient_inner(&state, input).await;
        assert!(matches!(result, Err(AppError::Validation(_))));

        // Age must be between 0 and 150
        let input = CreatePatient {
            name: "John".into(),
            age: 200,
            gender: "Male".into(),
            phone: "123".into(),
            email: None,
            address: None,
        };
        let result = upsert_patient_inner(&state, input).await;
        assert!(matches!(result, Err(AppError::Validation(_))));
    }

    #[tokio::test]
    async fn test_patient_crud_lifecycle() {
        let state = setup_test_db().await;

        // 1. Create
        let input = CreatePatient {
            name: "Alice Smith".into(),
            age: 28,
            gender: "Female".into(),
            phone: "555-0101".into(),
            email: Some("alice@example.com".into()),
            address: None,
        };
        let alice = upsert_patient_inner(&state, input).await.unwrap();
        assert_eq!(alice.name, "Alice Smith");

        // 2. Read
        let patients = get_patients_inner(&state).await.unwrap();
        assert_eq!(patients.len(), 1);
        assert_eq!(patients[0].id, alice.id);

        // 3. Delete
        delete_patient_inner(&state, alice.id.clone()).await.unwrap();
        let patients = get_patients_inner(&state).await.unwrap();
        assert_eq!(patients.len(), 0);

        // 4. Delete non-existent
        let result = delete_patient_inner(&state, alice.id).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn test_staff_crud_lifecycle() {
        let state = setup_test_db().await;

        // 1. Create
        let input = CreateStaff {
            name: "Dr. Gregory House".into(),
            role: "Diagnostic Medicine".into(),
            department: "Diagnostics".into(),
            phone: "555-0001".into(),
            email: Some("house@ppth.com".into()),
        };
        let staff = upsert_staff_inner(&state, input).await.unwrap();
        assert_eq!(staff.name, "Dr. Gregory House");

        // 2. Read
        let staff_list = get_staff_inner(&state).await.unwrap();
        assert_eq!(staff_list.len(), 1);

        // 3. Delete
        delete_staff_inner(&state, staff.id.clone()).await.unwrap();
        let staff_list = get_staff_inner(&state).await.unwrap();
        assert_eq!(staff_list.len(), 0);
    }

    #[tokio::test]
    async fn test_inventory_crud_lifecycle() {
        let state = setup_test_db().await;

        // 1. Create
        let input = CreateInventoryItem {
            name: "Aspirin".into(),
            category: "Medicine".into(),
            quantity: 100,
            unit: "Tablets".into(),
            min_quantity: 20,
        };
        let item = upsert_inventory_item_inner(&state, input).await.unwrap();
        assert_eq!(item.name, "Aspirin");

        // 2. Read
        let items = get_inventory_items_inner(&state).await.unwrap();
        assert_eq!(items.len(), 1);

        // 3. Delete
        delete_inventory_item_inner(&state, item.id.clone()).await.unwrap();
        let items = get_inventory_items_inner(&state).await.unwrap();
        assert_eq!(items.len(), 0);
    }

    #[tokio::test]
    async fn test_appointment_fk_validation() {
        let state = setup_test_db().await;

        let input = CreateAppointment {
            patient_id: Uuid::new_v4().to_string(),
            staff_id: Uuid::new_v4().to_string(),
            title: "Checkup".into(),
            description: None,
            scheduled_at: "2026-04-08T10:00:00Z".into(),
            duration_minutes: 30,
        };

        // Should fail because patient and staff don't exist
        let result = upsert_appointment_inner(&state, input).await;
        assert!(matches!(result, Err(AppError::Validation(_))));
    }
}
