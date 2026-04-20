"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getStaff,
  upsertStaff,
  deleteStaff,
  type Staff,
  type CreateStaff,
} from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Trash2, X, Pencil } from "lucide-react";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });

  const createMutation = useMutation({
    mutationFn: upsertStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowForm(false);
      setEditingStaff(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div id="main-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Staff</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
              Manage staff directory
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
            Add Staff
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '9999px',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                padding: '10px 16px 10px 40px',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
              {search ? "No staff match your search" : "No staff yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)' }}>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Name</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Department</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Phone</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                  <th className="text-right p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.name}</td>
                    <td className="p-4">
                      <span style={{ borderRadius: '9999px', padding: '4px 12px', fontSize: '0.75rem', background: 'var(--color-bg-button)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-default)' }}>
                        {s.role}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{s.department}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{s.phone}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{s.email || "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingStaff(s); setShowForm(true); }}
                          style={{ borderRadius: '9999px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)' }}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete staff member "${s.name}"? This cannot be undone.`)) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
                          style={{ borderRadius: '9999px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <StaffFormModal
            staff={editingStaff}
            onClose={() => { setShowForm(false); setEditingStaff(null); }}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function StaffFormModal({
  staff,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  staff: Staff | null;
  onClose: () => void;
  onSubmit: (data: CreateStaff) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(staff?.name || "");
  const [role, setRole] = useState(staff?.role || "");
  const [department, setDepartment] = useState(staff?.department || "");
  const [phone, setPhone] = useState(staff?.phone || "");
  const [email, setEmail] = useState(staff?.email || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: staff?.id, name, role, department, phone, email: email || null });
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
          <h3>{staff ? "Edit Staff" : "Add Staff"}</h3>
          <button onClick={onClose} style={{ borderRadius: '9999px', padding: '8px', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent' }}>
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Role *</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} required maxLength={100} placeholder="e.g. Doctor, Nurse" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Department *</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required maxLength={100} placeholder="e.g. Cardiology" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phone *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={50} style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ borderRadius: '9999px', border: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ borderRadius: '9999px', background: 'var(--color-bg-button)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', border: '1px solid var(--color-text-primary)', opacity: isSubmitting ? 0.5 : 1, cursor: 'pointer' }}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}