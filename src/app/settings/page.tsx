"use client";

import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { FileDown, HardDrive, CheckCircle, AlertCircle, FolderOpen } from "lucide-react";
import { generateReport, backupDatabase } from "@/lib/api";
import { save, open } from "@tauri-apps/plugin-dialog";

export default function SettingsPage() {
  const [reportPath, setReportPath] = useState("");
  const [backupDir, setBackupDir] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [backupStatus, setBackupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reportMsg, setReportMsg] = useState("");
  const [backupMsg, setBackupMsg] = useState("");

  const handleSelectReportPath = async () => {
    try {
      const selected = await save({
        title: "Export PDF Report",
        filters: [{ name: "PDF Document", extensions: ["pdf"] }],
        defaultPath: "hms_report.pdf",
      });
      if (selected) {
        setReportPath(selected);
      }
    } catch (e) {
      console.error("Dialog error:", e);
    }
  };

  const handleExportReport = async () => {
    if (!reportPath.trim()) {
      setReportStatus("error");
      setReportMsg("Please specify an output path");
      return;
    }
    setReportStatus("loading");
    setReportMsg("");
    try {
      const path = await generateReport(reportPath);
      setReportStatus("success");
      setReportMsg(`Report saved to: ${path}`);
    } catch (e: unknown) {
      setReportStatus("error");
      setReportMsg(e instanceof Error ? e.message : "Failed to generate report");
    }
  };

  const handleSelectBackupDir = async () => {
    try {
      const selected = await open({
        title: "Select Backup Directory",
        directory: true,
        multiple: false,
      });
      if (selected) {
        setBackupDir(selected as string);
      }
    } catch (e) {
      console.error("Dialog error:", e);
    }
  };

  const handleBackup = async () => {
    if (!backupDir.trim()) {
      setBackupStatus("error");
      setBackupMsg("Please specify a backup directory");
      return;
    }
    setBackupStatus("loading");
    setBackupMsg("");
    try {
      const path = await backupDatabase(backupDir);
      setBackupStatus("success");
      setBackupMsg(`Backup saved to: ${path}`);
    } catch (e: unknown) {
      setBackupStatus("error");
      setBackupMsg(e instanceof Error ? e.message : "Backup failed");
    }
  };

  const cardStyle = {
    border: '1px solid var(--color-border-default)',
    borderRadius: '8px',
    padding: '24px',
    background: 'var(--color-bg-surface)',
    marginBottom: '32px'
  };

  const inputContainerStyle = {
    display: 'flex',
    border: '1px solid var(--color-border-default)',
    borderRadius: '9999px',
    background: 'var(--color-bg-button)',
    overflow: 'hidden',
  };

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    padding: '10px 16px',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    border: 'none',
    outline: 'none',
  };

  return (
    <AppShell>
      <div id="main-content">
        <h1 className="mb-1">Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '48px' }}>
          Export reports and manage backups
        </p>

        {/* Export Report */}
        <div style={cardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <FileDown className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <h3>Export Report</h3>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Generate a PDF report containing all patients, staff, and inventory data.
          </p>
          <div className="flex gap-3">
            <div style={inputContainerStyle}>
              <input
                type="text"
                readOnly
                value={reportPath}
                placeholder="Click browse to select destination..."
                style={inputStyle}
              />
              <button
                onClick={handleSelectReportPath}
                style={{ 
                  padding: '10px 16px', 
                  borderLeft: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
                title="Browse"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleExportReport}
              disabled={reportStatus === "loading" || !reportPath}
              style={{ 
                background: 'var(--color-bg-button)',
                color: 'var(--color-text-primary)',
                padding: '10px 24px',
                borderRadius: '9999px',
                border: '1px solid var(--color-text-primary)',
                fontSize: '0.875rem',
                opacity: reportStatus === "loading" || !reportPath ? 0.5 : 1,
                cursor: 'pointer'
              }}
            >
              {reportStatus === "loading" ? "Generating..." : "Export PDF"}
            </button>
          </div>
          {reportMsg && (
            <StatusMessage status={reportStatus} message={reportMsg} />
          )}
        </div>

        {/* Database Backup */}
        <div style={cardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <h3>Database Backup</h3>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Create a copy of the SQLite database to a user-defined location.
          </p>
          <div className="flex gap-3">
            <div style={inputContainerStyle}>
              <input
                type="text"
                readOnly
                value={backupDir}
                placeholder="Click browse to select directory..."
                style={inputStyle}
              />
              <button
                onClick={handleSelectBackupDir}
                style={{ 
                  padding: '10px 16px', 
                  borderLeft: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
                title="Browse"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupStatus === "loading" || !backupDir}
              style={{ 
                background: 'var(--color-bg-button)',
                color: 'var(--color-text-primary)',
                padding: '10px 24px',
                borderRadius: '9999px',
                border: '1px solid var(--color-text-primary)',
                fontSize: '0.875rem',
                opacity: backupStatus === "loading" || !backupDir ? 0.5 : 1,
                cursor: 'pointer'
              }}
            >
              {backupStatus === "loading" ? "Backing up..." : "Backup"}
            </button>
          </div>
          {backupMsg && (
            <StatusMessage status={backupStatus} message={backupMsg} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatusMessage({ status, message }: { status: string; message: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      {status === "success" ? (
        <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-brand)' }} />
      ) : (
        <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
      )}
      <span>{message}</span>
    </div>
  );
}