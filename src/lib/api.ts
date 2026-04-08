import { invoke } from "@tauri-apps/api/core";

// Re-export types that match the Rust structs
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePatient {
  id?: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointment {
  id?: string;
  patient_id: string;
  staff_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStaff {
  id?: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
}

export interface AppError {
  code: string;
  message: string;
}

// ─── Patients ──────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  return invoke<Patient[]>("get_patients");
}

export async function upsertPatient(input: CreatePatient): Promise<Patient> {
  return invoke<Patient>("upsert_patient", { input });
}

export async function deletePatient(id: string): Promise<void> {
  return invoke<void>("delete_patient", { id });
}

// ─── Appointments ──────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  return invoke<Appointment[]>("get_appointments");
}

export async function upsertAppointment(input: CreateAppointment): Promise<Appointment> {
  return invoke<Appointment>("upsert_appointment", { input });
}

export async function deleteAppointment(id: string): Promise<void> {
  return invoke<void>("delete_appointment", { id });
}

// ─── Staff ─────────────────────────────────────────────────

export async function getStaff(): Promise<Staff[]> {
  return invoke<Staff[]>("get_staff");
}

export async function upsertStaff(input: CreateStaff): Promise<Staff> {
  return invoke<Staff>("upsert_staff", { input });
}

export async function deleteStaff(id: string): Promise<void> {
  return invoke<void>("delete_staff", { id });
}

// ─── Inventory ─────────────────────────────────────────────

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return invoke<InventoryItem[]>("get_inventory_items");
}

export async function upsertInventoryItem(input: CreateInventoryItem): Promise<InventoryItem> {
  return invoke<InventoryItem>("upsert_inventory_item", { input });
}

export async function deleteInventoryItem(id: string): Promise<void> {
  return invoke<void>("delete_inventory_item", { id });
}

// ─── Reports ───────────────────────────────────────────────

export async function generateReport(outputPath: string): Promise<string> {
  return invoke<string>("generate_report", { outputPath });
}

// ─── Backup ────────────────────────────────────────────────

export async function backupDatabase(destDir: string): Promise<string> {
  return invoke<string>("backup_database", { destDir });
}
