"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPatients,
  getAppointments,
  getStaff,
  getInventoryItems,
  deletePatient,
} from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";

export default function DashboardPage() {
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventoryItems,
  });

  return (
    <AppShell>
      <div>
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-[#737373] dark:text-[#a3a3a3] text-base">
          Welcome to HMS — your local-first hospital management system.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Patients", count: patients.length },
            { label: "Appointments", count: appointments.length },
            { label: "Staff", count: staff.length },
            { label: "Inventory", count: inventory.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#141414] p-6"
            >
              <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-display font-medium text-[#000000] dark:text-[#ffffff]">
                {stat.count}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Patients */}
        {patients.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 text-[1.25rem]">Recent Patients</h3>
            <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] dark:border-[#262626]">
                    <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">
                      Name
                    </th>
                    <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">
                      Age
                    </th>
                    <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 5).map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#e5e5e5] dark:border-[#262626] last:border-0"
                    >
                      <td className="p-4 text-[#262626] dark:text-[#d4d4d4]">
                        {p.name}
                      </td>
                      <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">
                        {p.age}
                      </td>
                      <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">
                        {p.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
