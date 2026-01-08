import { useState, useEffect } from "react";
import { Bell, Download, Upload, Trash2, Shield, Moon, Info } from "lucide-react";
import { requestNotificationPermission, checkNotificationPermission } from "../services/notifications";
import { getDatabase } from "../services/database";

export function Settings() {
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        checkNotificationPermission().then(setNotificationPermission);
    }, []);

    const handleRequestNotifications = async () => {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const db = await getDatabase();
            const contacts = await db.getAll("contacts");
            const interactions = await db.getAll("interactions");
            const reminders = await db.getAll("reminders");

            const exportData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                data: {
                    contacts,
                    interactions,
                    reminders,
                },
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `prm-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.version || !importData.data) {
                throw new Error("Invalid backup file format");
            }

            const db = await getDatabase();
            const tx = db.transaction(["contacts", "interactions", "reminders"], "readwrite");

            // Import contacts
            for (const contact of importData.data.contacts || []) {
                await tx.objectStore("contacts").put(contact);
            }

            // Import interactions
            for (const interaction of importData.data.interactions || []) {
                await tx.objectStore("interactions").put(interaction);
            }

            // Import reminders
            for (const reminder of importData.data.reminders || []) {
                await tx.objectStore("reminders").put(reminder);
            }

            await tx.done;
            alert("Data imported successfully! Please refresh the page.");
            window.location.reload();
        } catch (error) {
            console.error("Import failed:", error);
            alert("Failed to import data. Please check the file format.");
        }

        // Reset file input
        e.target.value = "";
    };

    const handleClearData = async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete ALL data? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const db = await getDatabase();
            const tx = db.transaction(["contacts", "interactions", "reminders"], "readwrite");
            await tx.objectStore("contacts").clear();
            await tx.objectStore("interactions").clear();
            await tx.objectStore("reminders").clear();
            await tx.done;

            alert("All data has been deleted.");
            window.location.reload();
        } catch (error) {
            console.error("Clear failed:", error);
            alert("Failed to clear data");
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Customize your experience</p>
            </div>

            {/* Notifications */}
            <section className="card mb-md">
                <div className="flex items-center gap-sm mb-md">
                    <Bell size={20} style={{ color: "var(--color-accent-primary)" }} />
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Notifications</h2>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p style={{ marginBottom: "4px" }}>Push Notifications</p>
                        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                            Get reminded about scheduled calls and birthdays
                        </p>
                    </div>
                    {notificationPermission === "granted" ? (
                        <span
                            className="contact-status good"
                            style={{ fontSize: "0.875rem" }}
                        >
                            Enabled
                        </span>
                    ) : notificationPermission === "denied" ? (
                        <span
                            className="contact-status overdue"
                            style={{ fontSize: "0.875rem" }}
                        >
                            Blocked
                        </span>
                    ) : (
                        <button className="btn btn-primary" onClick={handleRequestNotifications}>
                            Enable
                        </button>
                    )}
                </div>

                {notificationPermission === "denied" && (
                    <p
                        style={{
                            marginTop: "var(--space-md)",
                            padding: "var(--space-sm)",
                            background: "var(--color-danger-glow)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.875rem",
                        }}
                    >
                        Notifications are blocked. Please enable them in your browser settings.
                    </p>
                )}
            </section>

            {/* Data Management */}
            <section className="card mb-md">
                <div className="flex items-center gap-sm mb-md">
                    <Shield size={20} style={{ color: "var(--color-success)" }} />
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Data & Privacy</h2>
                </div>

                <p
                    style={{
                        marginBottom: "var(--space-md)",
                        padding: "var(--space-sm)",
                        background: "var(--color-success-glow)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                    }}
                >
                    ✓ All your data is stored locally on this device. Nothing is sent to external servers.
                </p>

                <div className="flex flex-col gap-sm">
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportData}
                        disabled={isExporting}
                        style={{ justifyContent: "flex-start" }}
                    >
                        <Download size={18} />
                        {isExporting ? "Exporting..." : "Export Data (JSON)"}
                    </button>

                    <label className="btn btn-secondary" style={{ justifyContent: "flex-start", cursor: "pointer" }}>
                        <Upload size={18} />
                        Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            style={{ display: "none" }}
                        />
                    </label>

                    <button
                        className="btn btn-secondary"
                        onClick={handleClearData}
                        style={{ justifyContent: "flex-start", color: "var(--color-danger)" }}
                    >
                        <Trash2 size={18} />
                        Delete All Data
                    </button>
                </div>
            </section>

            {/* About */}
            <section className="card">
                <div className="flex items-center gap-sm mb-md">
                    <Info size={20} style={{ color: "var(--color-info)" }} />
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>About</h2>
                </div>

                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    <p style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "var(--color-text-primary)" }}>Personal Relationship Manager</strong>
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                        A privacy-first PWA for managing personal relationships through automated reminders and
                        interaction tracking.
                    </p>
                    <p>Version 1.0.0</p>
                </div>
            </section>
        </div>
    );
}
