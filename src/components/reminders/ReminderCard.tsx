import { Phone, Clock, Check, X } from "lucide-react";
import type { Reminder } from "../../types";
import { usePRMStore } from "../../store";

interface ReminderCardProps {
    reminder: Reminder;
    contactName: string;
    phoneNumber?: string;
}

function getReminderIcon(type: Reminder["type"]) {
    switch (type) {
        case "birthday":
            return "🎂";
        case "anniversary":
            return "💐";
        case "scheduled_call":
            return <Phone size={18} />;
        default:
            return <Clock size={18} />;
    }
}

function getReminderIconClass(type: Reminder["type"]) {
    switch (type) {
        case "birthday":
            return "birthday";
        case "anniversary":
            return "anniversary";
        default:
            return "call";
    }
}

function formatReminderTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 0) {
        return "Overdue";
    } else if (diffMins < 60) {
        return `In ${diffMins} min`;
    } else if (diffHours < 24) {
        return `In ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Tomorrow";
    } else {
        return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }
}

export function ReminderCard({ reminder, contactName, phoneNumber }: ReminderCardProps) {
    const { completeReminder, snoozeReminder, dismissReminder } = usePRMStore();

    const handleCall = () => {
        if (phoneNumber) {
            window.open(`tel:${phoneNumber}`, "_self");
            completeReminder(reminder.id);
        }
    };

    return (
        <div className="card">
            <div className="reminder-card">
                <div className={`reminder-icon ${getReminderIconClass(reminder.type)}`}>
                    {getReminderIcon(reminder.type)}
                </div>

                <div className="reminder-content">
                    <div className="reminder-title">{contactName}</div>
                    <div className="reminder-time">
                        {formatReminderTime(reminder.scheduledFor)}
                        {reminder.type === "scheduled_call" && " • Scheduled call"}
                        {reminder.type === "birthday" && " • Birthday"}
                        {reminder.type === "anniversary" && " • Anniversary"}
                    </div>
                </div>

                <div className="reminder-actions">
                    {phoneNumber && (
                        <button
                            className="btn btn-icon btn-call"
                            onClick={handleCall}
                            title="Call now"
                        >
                            <Phone size={16} />
                        </button>
                    )}
                    <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => snoozeReminder(reminder.id, 60)}
                        title="Snooze 1 hour"
                    >
                        <Clock size={16} />
                    </button>
                    <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => completeReminder(reminder.id)}
                        title="Mark complete"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        className="btn btn-icon btn-ghost"
                        onClick={() => dismissReminder(reminder.id)}
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
