"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
} from "@tanstack/react-query";
import {
  getPatients,
  getAppointments,
  getStaff,
  getInventoryItems,
} from "@/lib/api";

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
      <div id="main-content">
        <h1 className="mb-2">Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
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
              className="rounded-lg"
              style={{ 
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                padding: '24px'
              }}
            >
              <p className="code-label" style={{ fontSize: '0.75rem' }}>
                {stat.label}
              </p>
              <p 
                className="mt-2 text-3xl font-display" 
                style={{ 
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.0
                }}
              >
                {stat.count}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Patients */}
        {patients.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4" style={{ fontSize: '1.25rem' }}>Recent Patients</h3>
            <div 
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--color-border-default)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                    <th 
                      className="text-left p-4 font-medium" 
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Name
                    </th>
                    <th 
                      className="text-left p-4 font-medium" 
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Age
                    </th>
                    <th 
                      className="text-left p-4 font-medium" 
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 5).map((p) => (
                    <tr
                      key={p.id}
                      style={{ 
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </td>
                      <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {p.age}
                      </td>
                      <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
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