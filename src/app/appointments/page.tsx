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
  type CreateAppointment,
} from "@/lib/api";
import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

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

  // Group by date
  const byDate = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const date = a.scheduled_at.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(a);
  }

  const sortedDates = [...byDate.keys()].sort();

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Appointments</h1>
            <p className="text-[#737373] dark:text-[#a3a3a3] text-base">
              Schedule and manage appointments
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {loadingAppts ? (
          <div className="p-12 text-center text-[#737373]">Loading...</div>
        ) : sortedDates.length === 0 ? (
          <div className="p-12 text-center text-[#737373]">
            No appointments scheduled
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => {
              const dayAppts = byDate.get(date)!;
              return (
                <div key={date}>
                  <h3 className="text-[1.25rem] mb-3">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="space-y-2">
                    {dayAppts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#141414] p-4"
                      >
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                              Time
                            </p>
                            <p className="text-sm font-medium text-[#262626] dark:text-[#d4d4d4]">
                              {new Date(a.scheduled_at).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                              Patient
                            </p>
                            <p className="text-sm font-medium text-[#262626] dark:text-[#d4d4d4]">
                              {patientMap.get(a.patient_id) || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                              Staff
                            </p>
                            <p className="text-sm font-medium text-[#262626] dark:text-[#d4d4d4]">
                              {staffMap.get(a.staff_id) || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                              Duration
                            </p>
                            <p className="text-sm font-medium text-[#262626] dark:text-[#d4d4d4]">
                              {a.duration_minutes} min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="rounded-full bg-[#e5e5e5] dark:bg-[#262626] px-3 py-1 text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                            {a.status}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete appointment "${a.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(a.id);
                              }
                            }}
                            className="rounded-full p-2 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#737373]" />
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
            patients={patients}
            staff={staffList}
            onClose={() => setShowForm(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function AppointmentFormModal({
  patients,
  staff,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  patients: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (data: CreateAppointment) => void;
  isSubmitting: boolean;
}) {
  const [patientId, setPatientId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patient_id: patientId,
      staff_id: staffId,
      title,
      description: description || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: parseInt(duration) || 30,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-lg rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.5rem]">New Appointment</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4 text-[#737373]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Patient *
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Staff *
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            >
              <option value="">Select staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Duration (min) *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min="5"
                step="5"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] text-[#404040] dark:text-[#d4d4d4] px-6 py-2.5 text-sm font-medium hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "Saving..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
