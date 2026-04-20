"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAppointments,
  upsertAppointment,
  deleteAppointment,
  getPatients,
  getStaff,
  type Appointment,
  type CreateAppointment,
} from "@/lib/api";
import { useState } from "react";
import { Plus, X, Trash2, Pencil } from "lucide-react";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });

  const createMutation = useMutation({
    mutationFn: upsertAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setShowForm(false);
      setEditingAppointment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const patientMap = new Map(patients.map((p) => [p.id, p.name]));
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));

  const byDate = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const date = a.scheduled_at.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(a);
  }

  const sortedDates = [...byDate.keys()].sort();

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid var(--color-border-default)',
    borderRadius: '8px',
    background: 'var(--color-bg-surface)',
    padding: '16px',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const valueStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
  };

  return (
    <AppShell>
      <div id="main-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Appointments</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
              Schedule and manage appointments
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'var(--color-bg-button)',
              color: 'var(--color-text-primary)',
              padding: '8px 24px',
              borderRadius: '9999px',
              border: '1px solid var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {loadingAppts ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : sortedDates.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
            No appointments scheduled
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => {
              const dayAppts = byDate.get(date)!;
              return (
                <div key={date}>
                  <h3 className="mb-3" style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="space-y-2">
                    {dayAppts.map((a) => (
                      <div key={a.id} style={cardStyle}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div>
                            <p style={labelStyle}>Time</p>
                            <p style={valueStyle}>
                              {new Date(a.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div>
                            <p style={labelStyle}>Patient</p>
                            <p style={valueStyle}>{patientMap.get(a.patient_id) || "Unknown"}</p>
                          </div>
                          <div>
                            <p style={labelStyle}>Staff</p>
                            <p style={valueStyle}>{staffMap.get(a.staff_id) || "Unknown"}</p>
                          </div>
                          <div>
                            <p style={labelStyle}>Duration</p>
                            <p style={valueStyle}>{a.duration_minutes} min</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                          <span 
                            style={{ 
                              borderRadius: '9999px', 
                              padding: '4px 12px', 
                              fontSize: '0.75rem',
                              background: 'var(--color-bg-button)',
                              color: 'var(--color-text-muted)',
                              border: '1px solid var(--color-border-default)'
                            }}
                          >
                            {a.status}
                          </span>
                          <button
                            onClick={() => { setEditingAppointment(a); setShowForm(true); }}
                            style={{ borderRadius: '9999px', padding: '8px', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent' }}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete appointment "${a.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(a.id);
                              }
                            }}
                            style={{ borderRadius: '9999px', padding: '8px', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent' }}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <AppointmentFormModal
            appointment={editingAppointment}
            patients={patients}
            staff={staffList}
            onClose={() => { setShowForm(false); setEditingAppointment(null); }}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function AppointmentFormModal({
  appointment,
  patients,
  staff,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  appointment: Appointment | null;
  patients: { id: string; name: string }[];
  staff: { id: string; name: string; role: string }[];
  onClose: () => void;
  onSubmit: (data: CreateAppointment) => void;
  isSubmitting: boolean;
}) {
  const [patientId, setPatientId] = useState(appointment?.patient_id || "");
  const [staffId, setStaffId] = useState(appointment?.staff_id || "");
  const [title, setTitle] = useState(appointment?.title || "");
  const [description, setDescription] = useState(appointment?.description || "");
  const [scheduledAt, setScheduledAt] = useState(
    appointment?.scheduled_at ? new Date(appointment.scheduled_at).toISOString().slice(0, 16) : ""
  );
  const [duration, setDuration] = useState(appointment?.duration_minutes?.toString() || "30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 480) {
      alert("Please enter a valid duration between 1 and 480 minutes");
      return;
    }
    onSubmit({
      id: appointment?.id,
      patient_id: patientId,
      staff_id: staffId,
      title,
      description: description || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: parsedDuration,
    });
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-button)',
    color: 'var(--color-text-primary)',
    padding: '10px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-lg" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '24px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3>{appointment ? "Edit Appointment" : "New Appointment"}</h3>
          <button onClick={onClose} style={{ borderRadius: '9999px', padding: '8px', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent' }}>
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Patient *</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required style={inputStyle}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Staff *</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required style={inputStyle}>
              <option value="">Select staff</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Date & Time *</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Duration (min) *</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="5" step="5" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ borderRadius: '9999px', border: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ borderRadius: '9999px', background: 'var(--color-bg-button)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', border: '1px solid var(--color-text-primary)', opacity: isSubmitting ? 0.5 : 1, cursor: 'pointer' }}>
              {isSubmitting ? "Saving..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}