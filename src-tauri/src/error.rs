use serde::Serialize;
use thiserror::Error;

/// User-facing error message shown when a database error occurs.
/// The actual SQLx error is logged internally but never exposed to the frontend.
const DB_ERROR_MESSAGE: &str = "A database error occurred. Please try again or contact support.";

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error")]
    Database(#[from] sqlx::Error),

    #[error("Record not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("AppError", 2)?;
        match self {
            // Never expose internal DB details to the frontend
            AppError::Database(_) => {
                state.serialize_field("code", "DATABASE_ERROR")?;
                state.serialize_field("message", DB_ERROR_MESSAGE)?;
            }
            AppError::NotFound(msg) => {
                state.serialize_field("code", "NOT_FOUND")?;
                state.serialize_field("message", msg)?;
            }
            AppError::Validation(msg) => {
                state.serialize_field("code", "VALIDATION_ERROR")?;
                state.serialize_field("message", msg)?;
            }
            AppError::Internal(_) => {
                state.serialize_field("code", "INTERNAL_ERROR")?;
                state.serialize_field("message", "An internal error occurred. Please try again.")?;
            }
        }
        state.end()
    }
}
