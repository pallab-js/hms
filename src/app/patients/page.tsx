"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPatients,
  upsertPatient,
  deletePatient,
  type Patient,
  type CreatePatient,
} from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Trash2, X, Pencil } from "lucide-react";

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const createMutation = useMutation({
    mutationFn: upsertPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
      setEditingPatient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <AppShell>
      <div id="main-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Patients</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
              Manage patient records
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingPatient(null); }}
            className="flex items-center gap-2 rounded-full"
            style={{ 
              background: 'var(--color-bg-button)',
              color: 'var(--color-text-primary)',
              padding: '8px 32px',
              border: '1px solid var(--color-text-primary)'
            }}
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full"
              style={{ 
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                padding: '10px 16px 10px 40px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
              {search ? "No patients match your search" : "No patients yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)' }}>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Name</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Age</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Gender</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Phone</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                  <th className="text-right p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  >
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.name}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{p.age}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{p.gender}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{p.phone}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{p.email || "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPatient(p);
                            setShowForm(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                          style={{ 
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border-default)'
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete patient "${p.name}"? This cannot be undone.`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                          style={{ 
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border-default)'
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <PatientFormModal
            patient={editingPatient}
            onClose={() => { setShowForm(false); setEditingPatient(null); }}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function PatientFormModal({
  patient,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  patient: Patient | null;
  onClose: () => void;
  onSubmit: (data: CreatePatient) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(patient?.name || "");
  const [age, setAge] = useState(patient?.age?.toString() || "");
  const [gender, setGender] = useState(patient?.gender || "Male");
  const [phone, setPhone] = useState(patient?.phone || "");
  const [email, setEmail] = useState(patient?.email || "");
  const [address, setAddress] = useState(patient?.address || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      alert("Please enter a valid age between 0 and 150");
      return;
    }

    onSubmit({
      id: patient?.id,
      name,
      age: parsedAge,
      gender,
      phone,
      email: email || null,
      address: address || null,
    });
  };

  const inputStyle = {
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-button)',
    color: 'var(--color-text-primary)',
    padding: '10px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    width: '100%' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="w-full max-w-lg rounded-lg" 
        style={{ 
          background: 'var(--color-bg-surface)', 
          border: '1px solid var(--color-border-default)',
          padding: '24px'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3>{patient ? "Edit Patient" : "Add Patient"}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2"
            style={{ border: '1px solid var(--color-border-default)' }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Age *
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="0"
                max="150"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={inputStyle}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={50}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full"
              style={{ 
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                padding: '10px 24px',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full"
              style={{ 
                background: 'var(--color-bg-button)',
                color: 'var(--color-text-primary)',
                padding: '10px 24px',
                fontSize: '0.875rem',
                border: '1px solid var(--color-text-primary)',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}