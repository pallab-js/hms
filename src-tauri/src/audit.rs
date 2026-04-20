use crate::error::AppError;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn log_audit(
    pool: &SqlitePool,
    entity_type: &str,
    entity_id: &str,
    action: &str,
    old_values: Option<&str>,
    new_values: Option<&str>,
) -> Result<(), AppError> {
    let id = Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO audit_log (id, entity_type, entity_id, action, old_values, new_values, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(entity_type)
    .bind(entity_id)
    .bind(action)
    .bind(old_values)
    .bind(new_values)
    .bind(&timestamp)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(())
}