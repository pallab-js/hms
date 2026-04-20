import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

// ─── Zod Schemas ───────────────────────────────────────────

export const PatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  age: z.number().int().min(0).max(150),
  gender: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreatePatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  age: z.number().int().min(0).max(150),
  gender: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  email: z.string().email().nullable(),
  address: z.string().max(500).nullable(),
});

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().positive(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).nullable(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().positive(),
});

export const StaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateStaffSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  email: z.string().email().nullable(),
});

export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0),
  unit: z.string().min(1),
  min_quantity: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateInventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  quantity: z.number().int().min(0),
  unit: z.string().min(1).max(50),
  min_quantity: z.number().int().min(0),
});

function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

async function invokeValidated<T>(
  command: string,
  args: Record<string, unknown>,
  schema: z.ZodSchema<T>
): Promise<T> {
  const result = await invoke<T>(command, args);
  return validateResponse(schema, result);
}

// Re-export types that match the Rust structs
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

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

export async function getPatientsPaginated(page: number, limit: number): Promise<PaginatedResponse<Patient>> {
  return invoke<PaginatedResponse<Patient>>("get_patients_paginated", { page, limit });
}

export async function searchPatients(query: string, page: number, limit: number): Promise<PaginatedResponse<Patient>> {
  return invoke<PaginatedResponse<Patient>>("search_patients", { query, page, limit });
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

export async function getAppointmentsPaginated(page: number, limit: number): Promise<PaginatedResponse<Appointment>> {
  return invoke<PaginatedResponse<Appointment>>("get_appointments_paginated", { page, limit });
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

export async function getStaffPaginated(page: number, limit: number): Promise<PaginatedResponse<Staff>> {
  return invoke<PaginatedResponse<Staff>>("get_staff_paginated", { page, limit });
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

export async function getInventoryPaginated(page: number, limit: number): Promise<PaginatedResponse<InventoryItem>> {
  return invoke<PaginatedResponse<InventoryItem>>("get_inventory_paginated", { page, limit });
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

export async function restoreDatabase(backupPath: string): Promise<string> {
  return invoke<string>("restore_database", { backupPath });
}

export async function getBackupStatus(backupDir: string): Promise<string> {
  return invoke<string>("get_backup_status", { backupDir });
}

export interface HealthStatus {
  status: string;
  database: string;
  version: string;
  uptime_seconds: number;
}

export async function healthCheck(): Promise<HealthStatus> {
  return invoke<HealthStatus>("health_check");
}
