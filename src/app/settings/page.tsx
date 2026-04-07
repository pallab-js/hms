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

  return (
    <AppShell>
      <div>
        <h1 className="mb-1">Settings</h1>
        <p className="text-[#737373] dark:text-[#a3a3a3] text-base mb-12">
          Export reports and manage backups
        </p>

        {/* Export Report */}
        <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileDown className="w-5 h-5 text-[#525252] dark:text-[#a3a3a3]" />
            <h2 className="text-[1.25rem]">Export Report</h2>
          </div>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mb-4">
            Generate a PDF report containing all patients, staff, and inventory data.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 flex overflow-hidden rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-[#3b82f6]/50">
              <input
                type="text"
                readOnly
                value={reportPath}
                placeholder="Click browse to select destination..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none truncate"
              />
              <button
                onClick={handleSelectReportPath}
                className="px-4 py-2.5 border-l border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#141414] text-[#525252] dark:text-[#a3a3a3] transition-colors"
                title="Browse"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleExportReport}
              disabled={reportStatus === "loading" || !reportPath}
              className="rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {reportStatus === "loading" ? "Generating..." : "Export PDF"}
            </button>
          </div>
          {reportMsg && (
            <StatusMessage status={reportStatus} message={reportMsg} />
          )}
        </div>

        {/* Database Backup */}
        <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-[#525252] dark:text-[#a3a3a3]" />
            <h2 className="text-[1.25rem]">Database Backup</h2>
          </div>
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] mb-4">
            Create a copy of the SQLite database to a user-defined location.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 flex overflow-hidden rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-[#3b82f6]/50">
              <input
                type="text"
                readOnly
                value={backupDir}
                placeholder="Click browse to select directory..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none truncate"
              />
              <button
                onClick={handleSelectBackupDir}
                className="px-4 py-2.5 border-l border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#141414] text-[#525252] dark:text-[#a3a3a3] transition-colors"
                title="Browse"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupStatus === "loading" || !backupDir}
              className="rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
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
    <div className="mt-3 flex items-center gap-2 text-sm">
      {status === "success" ? (
        <CheckCircle className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
      ) : (
        <AlertCircle className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
      )}
      <span className="text-[#525252] dark:text-[#a3a3a3]">{message}</span>
    </div>
  );
}
