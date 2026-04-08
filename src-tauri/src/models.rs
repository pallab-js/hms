use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

// ─── Patient ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Type, FromRow)]
pub struct Patient {
    pub id: String,
    pub name: String,
    pub age: i32,
    pub gender: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreatePatient {
    pub id: Option<String>,
    pub name: String,
    pub age: i32,
    pub gender: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
}

// ─── Appointment ───────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Type, FromRow)]
pub struct Appointment {
    pub id: String,
    pub patient_id: String,
    pub staff_id: String,
    pub title: String,
    pub description: Option<String>,
    pub scheduled_at: String,
    pub duration_minutes: i32,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateAppointment {
    pub id: Option<String>,
    pub patient_id: String,
    pub staff_id: String,
    pub title: String,
    pub description: Option<String>,
    pub scheduled_at: String,
    pub duration_minutes: i32,
}

// ─── Staff ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Type, FromRow)]
pub struct Staff {
    pub id: String,
    pub name: String,
    pub role: String,
    pub department: String,
    pub phone: String,
    pub email: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateStaff {
    pub id: Option<String>,
    pub name: String,
    pub role: String,
    pub department: String,
    pub phone: String,
    pub email: Option<String>,
}

// ─── Inventory Item ────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Type, FromRow)]
pub struct InventoryItem {
    pub id: String,
    pub name: String,
    pub category: String,
    pub quantity: i32,
    pub unit: String,
    pub min_quantity: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateInventoryItem {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    pub quantity: i32,
    pub unit: String,
    pub min_quantity: i32,
}
