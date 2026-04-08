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
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Patients</h1>
            <p className="text-[#737373] dark:text-[#a3a3a3] text-base">
              Manage patient records
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingPatient(null); }}
            className="flex items-center gap-2 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search patients..."
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
              {search ? "No patients match your search" : "No patients yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#141414]">
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Name</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Age</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Gender</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Phone</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Email</th>
                  <th className="text-right p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-0 hover:bg-[#fafafa] dark:hover:bg-[#141414]"
                  >
                    <td className="p-4 font-medium text-[#262626] dark:text-[#d4d4d4]">{p.name}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{p.age}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{p.gender}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{p.phone}</td>
                    <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{p.email || "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPatient(p);
                            setShowForm(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
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
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-lg rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.5rem]">{patient ? "Edit Patient" : "Add Patient"}</h2>
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
                Age *
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="0"
                max="150"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
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
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
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
