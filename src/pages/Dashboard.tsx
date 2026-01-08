import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Bell, Heart, TrendingUp, Plus } from "lucide-react";
import { usePRMStore } from "../store";
import { ContactCard } from "../components/contacts";
import { ReminderCard } from "../components/reminders";
import { ContactForm } from "../components/contacts";
import { getDaysSinceLastInteraction } from "../services/interactions";

export function Dashboard() {
    const navigate = useNavigate();
    const { contacts, reminders, loadContacts, loadReminders } = usePRMStore();
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactDays, setContactDays] = useState<Record<string, number | null>>({});

    useEffect(() => {
        loadContacts();
        loadReminders();
    }, [loadContacts, loadReminders]);

    useEffect(() => {
        const loadDays = async () => {
            const days: Record<string, number | null> = {};
            for (const contact of contacts) {
                days[contact.id] = await getDaysSinceLastInteraction(contact.id);
            }
            setContactDays(days);
        };
        if (contacts.length > 0) {
            loadDays();
        }
    }, [contacts]);

    const pendingReminders = reminders.filter(
        (r) => r.status === "pending" || r.status === "triggered" || r.status === "snoozed"
    );

    const upcomingReminders = pendingReminders
        .filter((r) => new Date(r.scheduledFor) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
        .slice(0, 5);

    const overdueContacts = contacts.filter((c) => {
        const days = contactDays[c.id];
        return c.reminderConfig.enabled && days !== null && days > c.reminderConfig.intervalDays;
    });

    const stats = {
        totalContacts: contacts.length,
        pendingReminders: pendingReminders.length,
        overdueContacts: overdueContacts.length,
        connectionsThisWeek: 0, // Would need interaction history
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Stay connected with the people who matter</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-2 mb-md">
                <div className="card stat-card">
                    <Users size={24} style={{ color: "var(--color-accent-primary)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.totalContacts}</div>
                    <div className="stat-label">Contacts</div>
                </div>
                <div className="card stat-card">
                    <Bell size={24} style={{ color: "var(--color-warning)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.pendingReminders}</div>
                    <div className="stat-label">Pending Reminders</div>
                </div>
                <div className="card stat-card">
                    <Heart size={24} style={{ color: "var(--color-danger)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.overdueContacts}</div>
                    <div className="stat-label">Need Attention</div>
                </div>
                <div className="card stat-card">
                    <TrendingUp size={24} style={{ color: "var(--color-success)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.connectionsThisWeek}</div>
                    <div className="stat-label">This Week</div>
                </div>
            </div>

            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
                <section style={{ marginBottom: "var(--space-xl)" }}>
                    <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>
                        Upcoming Reminders
                    </h2>
                    <div className="flex flex-col gap-sm">
                        {upcomingReminders.map((reminder) => {
                            const contact = contacts.find((c) => c.id === reminder.contactId);
                            if (!contact) return null;
                            const phone = contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;
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
            )}

            {/* Need Attention */}
            {overdueContacts.length > 0 && (
                <section>
                    <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>
                        Need Attention
                    </h2>
                    <div className="flex flex-col gap-sm">
                        {overdueContacts.slice(0, 5).map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                daysSinceContact={contactDays[contact.id]}
                                onClick={() => navigate(`/contacts/${contact.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {contacts.length === 0 && (
                <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <h3 className="empty-state-title">No contacts yet</h3>
                    <p className="empty-state-text">
                        Start by adding your first contact to begin managing your relationships.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={() => setShowAddContact(true)}>
                        <Plus size={20} />
                        Add Your First Contact
                    </button>
                </div>
            )}

            {/* FAB */}
            {contacts.length > 0 && (
                <button className="fab" onClick={() => setShowAddContact(true)} title="Add Contact">
                    <Plus size={24} />
                </button>
            )}

            {/* Add Contact Modal */}
            {showAddContact && <ContactForm onClose={() => setShowAddContact(false)} />}
        </div>
    );
}
