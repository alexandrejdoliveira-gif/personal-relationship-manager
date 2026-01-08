import { Phone, AlertCircle, CheckCircle, Clock, Calendar } from "lucide-react";
import type { Contact } from "../../types";

interface ContactCardProps {
    contact: Contact;
    daysSinceContact?: number | null;
    onClick?: () => void;
}

function getAvatarClass(category: string): string {
    const lower = category.toLowerCase();
    if (lower === "family") return "family";
    if (lower === "friends") return "friends";
    if (lower === "professional" || lower === "work") return "professional";
    return "";
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Calculate next connection date
function getNextConnectionDate(lastSpokenDays: number | null, frequency: number): Date {
    const now = new Date();
    if (lastSpokenDays === null) {
        // No previous contact, next connection is today
        return now;
    }
    // Next connection = today - daysSince + frequency
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() - lastSpokenDays + frequency);
    return nextDate;
}

// Format next connection date
function formatNextConnection(nextDate: Date): { text: string; status: "overdue" | "today" | "upcoming" } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

    const diffDays = Math.floor((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, status: "overdue" };
    } else if (diffDays === 0) {
        return { text: "Due today", status: "today" };
    } else if (diffDays === 1) {
        return { text: "Due tomorrow", status: "upcoming" };
    } else if (diffDays <= 7) {
        return { text: `Due in ${diffDays}d`, status: "upcoming" };
    } else {
        return {
            text: next.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            status: "upcoming"
        };
    }
}

function getStatusInfo(daysSince: number | null, intervalDays: number) {
    if (daysSince === null) {
        return {
            class: "due-soon",
            icon: Clock,
            lastSpoken: "Never contacted",
            isPending: true
        };
    }

    const isPending = daysSince > intervalDays;
    const isApproaching = daysSince > intervalDays * 0.8;

    if (isPending) {
        return {
            class: "overdue",
            icon: AlertCircle,
            lastSpoken: `${daysSince} days ago`,
            isPending: true
        };
    }
    if (isApproaching) {
        return {
            class: "due-soon",
            icon: Clock,
            lastSpoken: `${daysSince} days ago`,
            isPending: false
        };
    }
    return {
        class: "good",
        icon: CheckCircle,
        lastSpoken: daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : `${daysSince} days ago`,
        isPending: false
    };
}

export function ContactCard({ contact, daysSinceContact, onClick }: ContactCardProps) {
    const statusInfo = getStatusInfo(daysSinceContact ?? null, contact.reminderConfig.intervalDays);
    const StatusIcon = statusInfo.icon;

    const nextConnection = getNextConnectionDate(daysSinceContact ?? null, contact.reminderConfig.intervalDays);
    const nextConnectionInfo = formatNextConnection(nextConnection);

    return (
        <div className="card card-clickable" onClick={onClick}>
            <div className="contact-card">
                <div className={`contact-avatar ${getAvatarClass(contact.category)}`}>
                    {contact.photoUrl ? (
                        <img src={contact.photoUrl} alt={contact.name} />
                    ) : (
                        getInitials(contact.name)
                    )}
                </div>

                <div className="contact-info">
                    <div className="contact-name">{contact.name}</div>
                    <div className="contact-relationship">
                        {contact.relationship.replace("_", " ")} • {contact.category}
                    </div>
                    {contact.reminderConfig.enabled && (
                        <div className="contact-meta">
                            <span className="contact-last-spoken">{statusInfo.lastSpoken}</span>
                            <span className="contact-separator">•</span>
                            <span className={`contact-next-date ${nextConnectionInfo.status}`}>
                                <Calendar size={10} />
                                {nextConnectionInfo.text}
                            </span>
                        </div>
                    )}
                </div>

                {contact.reminderConfig.enabled && (
                    <div className={`contact-status ${statusInfo.class}`}>
                        <StatusIcon size={12} />
                        {statusInfo.isPending ? "PENDING" : "OK"}
                    </div>
                )}

                {contact.phones.length > 0 && (
                    <button
                        className="btn btn-icon btn-call"
                        onClick={(e) => {
                            e.stopPropagation();
                            const phone = contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;
                            if (phone) window.open(`tel:${phone}`, "_self");
                        }}
                        title="Call"
                    >
                        <Phone size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
