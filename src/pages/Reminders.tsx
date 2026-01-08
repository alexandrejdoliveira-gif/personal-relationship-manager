import { useEffect } from "react";
import { Calendar } from "lucide-react";
import { usePRMStore } from "../store";
import { ReminderCard } from "../components/reminders";

export function Reminders() {
    const { contacts, reminders, loadContacts, loadReminders } = usePRMStore();

    useEffect(() => {
        loadContacts();
        loadReminders();
    }, [loadContacts, loadReminders]);

    const pendingReminders = reminders.filter(
        (r) => r.status === "pending" || r.status === "triggered" || r.status === "snoozed"
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const groupedReminders = {
        overdue: pendingReminders.filter((r) => new Date(r.scheduledFor) < today),
        today: pendingReminders.filter((r) => {
            const date = new Date(r.scheduledFor);
            return date >= today && date < tomorrow;
        }),
        tomorrow: pendingReminders.filter((r) => {
            const date = new Date(r.scheduledFor);
            return date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        }),
        thisWeek: pendingReminders.filter((r) => {
            const date = new Date(r.scheduledFor);
            return date >= new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) && date < nextWeek;
        }),
        later: pendingReminders.filter((r) => new Date(r.scheduledFor) >= nextWeek),
    };

    const renderReminderGroup = (title: string, items: typeof reminders, urgent = false) => {
        if (items.length === 0) return null;

        return (
            <section style={{ marginBottom: "var(--space-xl)" }}>
                <h2
                    style={{
                        fontSize: "1rem",
                        marginBottom: "var(--space-md)",
                        color: urgent ? "var(--color-danger)" : "var(--color-text-secondary)",
                    }}
                >
                    {title} ({items.length})
                </h2>
                <div className="flex flex-col gap-sm">
                    {items.map((reminder) => {
                        const contact = contacts.find((c) => c.id === reminder.contactId);
                        if (!contact) return null;
                        const phone =
                            contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;
                        return (
                            <ReminderCard
                                key={reminder.id}
                                reminder={reminder}
                                contactName={contact.name}
                                phoneNumber={phone}
                            />
                        );
                    })}
                </div>
            </section>
        );
    };

    const hasNoReminders = pendingReminders.length === 0;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Reminders</h1>
                <p className="page-subtitle">
                    {pendingReminders.length} pending reminder{pendingReminders.length !== 1 ? "s" : ""}
                </p>
            </div>

            {hasNoReminders ? (
                <div className="empty-state">
                    <Calendar className="empty-state-icon" />
                    <h3 className="empty-state-title">All caught up!</h3>
                    <p className="empty-state-text">
                        You have no pending reminders. Add contacts with reminder settings to automatically
                        schedule check-ins.
                    </p>
                </div>
            ) : (
                <>
                    {renderReminderGroup("Overdue", groupedReminders.overdue, true)}
                    {renderReminderGroup("Today", groupedReminders.today)}
                    {renderReminderGroup("Tomorrow", groupedReminders.tomorrow)}
                    {renderReminderGroup("This Week", groupedReminders.thisWeek)}
                    {renderReminderGroup("Later", groupedReminders.later)}
                </>
            )}
        </div>
    );
}
