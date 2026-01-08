import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Phone,
    MessageSquare,
    Edit,
    Calendar,
    Sparkles,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { usePRMStore } from "../store";
import { ContactForm } from "../components/contacts";
import { QuickLogModal } from "../components/interactions";
import { getInteractionsByContact, logInteraction } from "../services/interactions";
import { syncContactReminder } from "../services/reminders";
import type { Interaction } from "../types";

export function ContactDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { contacts, loadContacts, loadReminders } = usePRMStore();
    const [showEdit, setShowEdit] = useState(false);
    const [showLogInteraction, setShowLogInteraction] = useState(false);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isMarking, setIsMarking] = useState(false);

    const contact = contacts.find((c) => c.id === id);

    const loadInteractions = useCallback(async () => {
        if (id) {
            const data = await getInteractionsByContact(id);
            setInteractions(
                data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            );
        }
    }, [id]);

    useEffect(() => {
        if (contacts.length === 0) {
            loadContacts();
        }
    }, [contacts.length, loadContacts]);

    useEffect(() => {
        loadInteractions();
    }, [loadInteractions]);

    // Handle Mark as Contacted - RESET CYCLE
    const handleMarkAsContacted = async () => {
        if (!contact || isMarking) return;

        setIsMarking(true);
        try {
            // 1. Log interaction with today's date
            await logInteraction({
                contactId: contact.id,
                type: "other",
                direction: "outgoing",
                notes: "Marked as contacted",
                timestamp: new Date().toISOString(),
                source: "manual",
            });

            // 2. Sync reminder (this recalculates nextConnectionDate)
            await syncContactReminder(contact.id);

            // 3. Refresh interactions list
            await loadInteractions();

            // 4. Refresh reminders in global store
            await loadReminders();
        } finally {
            setIsMarking(false);
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

    // Calculate days since last interaction
    const getDaysSinceLastInteraction = (): number | null => {
        if (interactions.length === 0) return null;
        const lastDate = new Date(interactions[0].timestamp);
        const today = new Date();
        const diffTime = today.getTime() - lastDate.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // Check if contact is PENDING (overdue)
    const daysSince = getDaysSinceLastInteraction();
    const isPending = daysSince !== null
        ? daysSince > contact.reminderConfig.intervalDays
        : true; // No interaction = pending

    // Calculate age from birthday
    const calculateAge = (birthday: string): number | null => {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Calculate next connection date
    const getNextConnectionDate = (): { date: Date; text: string; status: "overdue" | "today" | "upcoming" } => {
        const intervalDays = contact.reminderConfig.intervalDays || 30;
        let nextDate: Date;

        if (interactions.length > 0) {
            nextDate = new Date(interactions[0].timestamp);
            nextDate.setDate(nextDate.getDate() + intervalDays);
        } else {
            // No interactions yet - due immediately
            nextDate = new Date();
        }

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextStart = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

        const diffDays = Math.floor((nextStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

        let status: "overdue" | "today" | "upcoming";
        if (diffDays < 0) {
            status = "overdue";
        } else if (diffDays === 0) {
            status = "today";
        } else {
            status = "upcoming";
        }

        const text = nextDate.toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        });

        return { date: nextDate, text, status };
    };

    // Get last spoken text
    const getLastSpoken = (): string => {
        if (daysSince === null) return "Never";
        if (daysSince === 0) return "Today";
        if (daysSince === 1) return "Yesterday";
        return `${daysSince} days ago`;
    };

    // Calculate days until next connection
    const calculateDaysLeft = (): number => {
        const nextInfo = getNextConnectionDate();
        const today = new Date();
        const diffTime = nextInfo.date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const age = contact.birthday ? calculateAge(contact.birthday) : null;
    const daysLeft = calculateDaysLeft();
    const nextConnectionInfo = getNextConnectionDate();

    // Format address lines
    const formatAddress = () => {
        if (!primaryAddress) return null;
        const lines = [];
        if (primaryAddress.street) lines.push(primaryAddress.street);
        if (primaryAddress.city || primaryAddress.state || primaryAddress.postalCode) {
            lines.push(
                [primaryAddress.city, primaryAddress.state, primaryAddress.postalCode]
                    .filter(Boolean)
                    .join(", ")
            );
        }
        if (primaryAddress.country) lines.push(primaryAddress.country);
        return lines;
    };

    const addressLines = formatAddress();

    return (
        <div className="contact-detail-page">
            {/* Hero Section */}
            <div className="contact-hero">
                <div className="contact-hero-nav">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => navigate(-1)}
                        style={{ color: "white" }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setShowEdit(true)}
                        style={{ color: "white" }}
                    >
                        <Edit size={20} />
                    </button>
                </div>

                <div className="contact-hero-avatar">
                    {contact.name.charAt(0).toUpperCase()}
                </div>

                <div className="contact-hero-info">
                    <div className="contact-hero-name">
                        <h1>{contact.name}</h1>
                        {age && <span className="contact-hero-age">{age}y</span>}
                        <span className={`contact-hero-badge ${isPending ? "pending" : "ok"}`}>
                            {isPending ? <AlertCircle size={12} /> : <Calendar size={12} />}
                            {isPending ? "PENDING" : `${daysLeft}D LEFT`}
                        </span>
                    </div>
                    <div className="contact-hero-relation">
                        {contact.relationship.replace("_", " ")}
                    </div>
                    {primaryPhone && (
                        <div className="contact-hero-phone">{primaryPhone}</div>
                    )}
                </div>

                <div className="contact-hero-actions">
                    {primaryPhone && (
                        <button
                            className="btn btn-call btn-lg"
                            onClick={() => window.open(`tel:${primaryPhone}`, "_self")}
                        >
                            <Phone size={18} />
                            Call
                        </button>
                    )}
                    {primaryPhone && (
                        <button
                            className="btn-whatsapp"
                            onClick={() => window.open(`https://wa.me/${primaryPhone.replace(/\D/g, "")}`, "_blank")}
                        >
                            <MessageSquare size={18} />
                            WhatsApp
                        </button>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="contact-info-section">
                {/* MARK AS CONTACTED - Primary Action */}
                <button
                    className={`btn btn-mark-contacted ${isPending ? "pending" : ""}`}
                    onClick={handleMarkAsContacted}
                    disabled={isMarking}
                >
                    <CheckCircle size={20} />
                    {isMarking ? "Updating..." : "Mark as Contacted"}
                </button>

                {/* Relationship Coach Card */}
                <div className="coach-card">
                    <div className="coach-card-header">
                        <Sparkles size={16} />
                        RELATIONSHIP COACH
                    </div>
                    <div className="coach-card-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowLogInteraction(true)}
                        >
                            Log Interaction
                        </button>
                        <button className="btn btn-secondary">
                            Gift Ideas
                        </button>
                    </div>
                </div>

                {/* Last Spoken + Next Connection Row */}
                <div className="contact-info-row">
                    <div className="contact-info-card">
                        <div className="contact-info-card-label">Last Spoken</div>
                        <div className={`contact-info-card-value ${isPending ? "danger" : ""}`}>
                            {getLastSpoken()}
                        </div>
                    </div>
                    <div className="contact-info-card">
                        <div className={`contact-info-card-label ${nextConnectionInfo.status}`}>
                            ◉ Next Connection
                        </div>
                        <div className={`contact-info-card-value ${nextConnectionInfo.status}`}>
                            {nextConnectionInfo.text}
                        </div>
                    </div>
                </div>

                {/* Frequency */}
                <div className="contact-info-card">
                    <div className="contact-info-card-label">Contact Frequency</div>
                    <div className="contact-info-card-value">
                        Every {contact.reminderConfig.intervalDays} days
                    </div>
                </div>

                {/* Birthday */}
                {contact.birthday && (
                    <div className="contact-info-card">
                        <div className="contact-info-card-label">Birthday</div>
                        <div className="contact-info-card-value">{contact.birthday}</div>
                    </div>
                )}

                {/* Address */}
                {addressLines && addressLines.length > 0 && (
                    <div className="contact-info-card address-card">
                        <div className="contact-info-card-label">Address</div>
                        <div className="contact-info-card-value">
                            {addressLines.map((line, idx) => (
                                <div key={idx}>{line}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {contact.notes && (
                    <div className="contact-info-card notes-card">
                        <div className="contact-info-card-label">Notes</div>
                        <div className="contact-info-card-value">{contact.notes}</div>
                    </div>
                )}

                {/* Interaction History */}
                {interactions.length > 0 && (
                    <div className="interaction-history">
                        <h3 className="interaction-history-title">Recent Activity</h3>
                        <div className="timeline">
                            {interactions.slice(0, 5).map((interaction) => (
                                <div key={interaction.id} className="timeline-item">
                                    <div className="timeline-date">
                                        {new Date(interaction.timestamp).toLocaleDateString()}
                                    </div>
                                    <div className="timeline-content">
                                        <span className="timeline-type">{interaction.type}</span>
                                        {interaction.notes && (
                                            <span className="timeline-notes"> - {interaction.notes}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEdit && <ContactForm contact={contact} onClose={() => setShowEdit(false)} />}

            {/* Log Interaction Modal */}
            {showLogInteraction && (
                <QuickLogModal
                    contact={contact}
                    onClose={() => {
                        setShowLogInteraction(false);
                        loadInteractions(); // Refresh after logging
                        loadReminders(); // Refresh reminders
                    }}
                />
            )}
        </div>
    );
}
