import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Edit,
    Trash2,
    MessageCircle,
    Clock,
} from "lucide-react";
import { usePRMStore } from "../store";
import { ContactForm } from "../components/contacts";
import { QuickLogModal } from "../components/interactions";
import { getInteractionsByContact } from "../services/interactions";
import type { Interaction } from "../types";

export function ContactDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { contacts, loadContacts, deleteContact } = usePRMStore();
    const [showEdit, setShowEdit] = useState(false);
    const [showLogInteraction, setShowLogInteraction] = useState(false);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const contact = contacts.find((c) => c.id === id);

    useEffect(() => {
        if (contacts.length === 0) {
            loadContacts();
        }
    }, [contacts.length, loadContacts]);

    useEffect(() => {
        if (id) {
            getInteractionsByContact(id).then((data) => {
                setInteractions(
                    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                );
            });
        }
    }, [id]);

    const handleDelete = async () => {
        if (!contact || isDeleting) return;
        if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
            setIsDeleting(true);
            await deleteContact(contact.id);
            navigate("/contacts");
        }
    };

    if (!contact) {
        return (
            <div className="empty-state">
                <h3 className="empty-state-title">Contact not found</h3>
                <button className="btn btn-primary" onClick={() => navigate("/contacts")}>
                    Back to Contacts
                </button>
            </div>
        );
    }

    const primaryPhone = contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;
    const primaryAddress = contact.addresses[0];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatInteractionTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return formatDate(dateStr);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-sm mb-md">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ flex: 1, fontSize: "1.5rem", fontWeight: 600 }}>{contact.name}</h1>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(true)}>
                    <Edit size={20} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Contact Info Card */}
            <div className="card mb-md">
                <div className="flex items-center gap-sm mb-md" style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ textTransform: "capitalize" }}>
                        {contact.relationship.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span>{contact.category}</span>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-sm mb-md">
                    {primaryPhone && (
                        <button
                            className="btn btn-call btn-lg"
                            onClick={() => window.open(`tel:${primaryPhone}`, "_self")}
                            style={{ flex: 1 }}
                        >
                            <Phone size={20} />
                            Call
                        </button>
                    )}
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => setShowLogInteraction(true)}
                        style={{ flex: 1 }}
                    >
                        <MessageCircle size={20} />
                        Log Interaction
                    </button>
                </div>

                {/* Contact Details */}
                <div className="flex flex-col gap-sm">
                    {contact.phones.map((phone, idx) => (
                        <a
                            key={idx}
                            href={`tel:${phone.number}`}
                            className="flex items-center gap-sm"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            <Phone size={18} style={{ color: "var(--color-text-muted)" }} />
                            <span>{phone.number}</span>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                                ({phone.label})
                            </span>
                        </a>
                    ))}

                    {contact.emails.map((email, idx) => (
                        <a
                            key={idx}
                            href={`mailto:${email}`}
                            className="flex items-center gap-sm"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            <Mail size={18} style={{ color: "var(--color-text-muted)" }} />
                            <span>{email}</span>
                        </a>
                    ))}

                    {primaryAddress && (
                        <a
                            href={`https://maps.google.com/maps?q=${encodeURIComponent(
                                `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.postalCode}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-sm"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            <MapPin size={18} style={{ color: "var(--color-text-muted)" }} />
                            <span>
                                {primaryAddress.street}, {primaryAddress.city}, {primaryAddress.state}
                            </span>
                        </a>
                    )}

                    {contact.birthday && (
                        <div className="flex items-center gap-sm">
                            <Calendar size={18} style={{ color: "var(--color-text-muted)" }} />
                            <span>Birthday: {formatDate(contact.birthday)}</span>
                        </div>
                    )}
                </div>

                {/* Reminder Config */}
                <div
                    className="flex items-center gap-sm mt-md"
                    style={{
                        padding: "var(--space-sm) var(--space-md)",
                        background: "var(--color-bg-tertiary)",
                        borderRadius: "var(--radius-md)",
                    }}
                >
                    <Clock size={18} style={{ color: "var(--color-accent-primary)" }} />
                    <span style={{ fontSize: "0.875rem" }}>
                        {contact.reminderConfig.enabled
                            ? `Reminder every ${contact.reminderConfig.intervalDays} days`
                            : "Reminders disabled"}
                    </span>
                </div>

                {/* Notes */}
                {contact.notes && (
                    <div className="mt-md">
                        <h3 style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                            Notes
                        </h3>
                        <p style={{ whiteSpace: "pre-wrap" }}>{contact.notes}</p>
                    </div>
                )}
            </div>

            {/* Interaction History */}
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>
                Interaction History
            </h2>

            {interactions.length > 0 ? (
                <div className="timeline">
                    {interactions.slice(0, 10).map((interaction) => (
                        <div key={interaction.id} className="timeline-item">
                            <div className="timeline-date">{formatInteractionTime(interaction.timestamp)}</div>
                            <div className="timeline-content">
                                <div className="flex items-center gap-sm">
                                    <span style={{ textTransform: "capitalize" }}>
                                        {interaction.type.replace("_", " ")}
                                    </span>
                                    <span style={{ color: "var(--color-text-muted)" }}>
                                        ({interaction.direction})
                                    </span>
                                </div>
                                {interaction.notes && (
                                    <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                                        {interaction.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center text-muted" style={{ padding: "var(--space-xl)" }}>
                    No interactions logged yet
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && <ContactForm contact={contact} onClose={() => setShowEdit(false)} />}

            {/* Log Interaction Modal */}
            {showLogInteraction && (
                <QuickLogModal contact={contact} onClose={() => setShowLogInteraction(false)} />
            )}
        </div>
    );
}
