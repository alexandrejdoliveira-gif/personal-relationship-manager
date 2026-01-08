import { Phone, AlertCircle, CheckCircle, Clock } from "lucide-react";
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

function getStatusInfo(daysSince: number | null, intervalDays: number) {
    if (daysSince === null) {
        return { class: "due-soon", icon: Clock, text: "No contact yet" };
    }
    if (daysSince > intervalDays) {
        return { class: "overdue", icon: AlertCircle, text: `${daysSince}d overdue` };
    }
    if (daysSince > intervalDays * 0.8) {
        return { class: "due-soon", icon: Clock, text: `${daysSince}d ago` };
    }
    return { class: "good", icon: CheckCircle, text: `${daysSince}d ago` };
}

export function ContactCard({ contact, daysSinceContact, onClick }: ContactCardProps) {
    const statusInfo = getStatusInfo(daysSinceContact ?? null, contact.reminderConfig.intervalDays);
    const StatusIcon = statusInfo.icon;

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
                </div>

                {contact.reminderConfig.enabled && (
                    <div className={`contact-status ${statusInfo.class}`}>
                        <StatusIcon size={12} />
                        {statusInfo.text}
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
