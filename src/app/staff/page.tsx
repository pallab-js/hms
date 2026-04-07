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
  type CreateStaff,
} from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });

  const createMutation = useMutation({
    mutationFn: upsertStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowForm(false);
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
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Staff</h1>
            <p className="text-[#737373] dark:text-[#a3a3a3] text-base">
              Manage staff directory
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] pl-10 pr-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#737373]">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#737373]">
              {search ? "No staff match your search" : "No staff yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#141414]">
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Name</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Role</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Department</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Phone</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Email</th>
                  <th className="text-right p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-0 hover:bg-[#fafafa] dark:hover:bg-[#141414]"
                  >
                    <td className="p-4 font-medium text-[#262626] dark:text-[#d4d4d4]">{s.name}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-[#e5e5e5] dark:bg-[#262626] px-3 py-1 text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                        {s.role}
                      </span>
                    </td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{s.department}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{s.phone}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{s.email || "—"}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete staff member "${s.name}"? This cannot be undone.`)) {
                            deleteMutation.mutate(s.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <StaffFormModal
            onClose={() => setShowForm(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function StaffFormModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: CreateStaff) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, role, department, phone, email: email || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-lg rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.5rem]">Add Staff</h2>
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
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Role *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Doctor, Nurse"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Department *
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Cardiology"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={50}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
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
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
