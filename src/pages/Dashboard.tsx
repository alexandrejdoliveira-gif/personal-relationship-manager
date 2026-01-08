import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Bell, Heart, TrendingUp, Plus } from "lucide-react";
import { usePRMStore } from "../store";
import { ContactCard } from "../components/contacts";
import { ReminderCard } from "../components/reminders";
import { ContactForm } from "../components/contacts";
import { getDaysSinceLastInteraction } from "../services/interactions";
import { getDatabase } from "../services/database";

export function Dashboard() {
    const navigate = useNavigate();
    const { contacts, reminders, loadContacts, loadReminders } = usePRMStore();
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactDays, setContactDays] = useState<Record<string, number | null>>({});
    const [connectionsThisWeek, setConnectionsThisWeek] = useState(0);

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

    // Calculate connections this week
    useEffect(() => {
        const calculateWeeklyConnections = async () => {
            const db = await getDatabase();
            const allInteractions = await db.getAll("interactions");

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const thisWeekInteractions = allInteractions.filter((i) => {
                const interactionDate = new Date(i.timestamp);
                return interactionDate >= weekAgo;
            });

            // Count unique contacts interacted with this week
            const uniqueContacts = new Set(thisWeekInteractions.map((i) => i.contactId));
            setConnectionsThisWeek(uniqueContacts.size);
        };

        calculateWeeklyConnections();
    }, [contacts, reminders]); // Re-run when data changes

    // Pending contacts = contacts with reminders enabled where days since > frequency
    const pendingContacts = contacts.filter((c) => {
        if (!c.reminderConfig.enabled) return false;
        const days = contactDays[c.id];
        if (days === null || days === undefined) return true; // Never contacted = pending
        return days > c.reminderConfig.intervalDays;
    });

    const pendingReminders = reminders.filter(
        (r) => r.status === "pending" || r.status === "triggered" || r.status === "snoozed"
    );

    const upcomingReminders = pendingReminders
        .filter((r) => new Date(r.scheduledFor) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
        .slice(0, 5);

    const stats = {
        totalContacts: contacts.length,
        pendingCount: pendingContacts.length,
        pendingReminders: pendingReminders.length,
        connectionsThisWeek: connectionsThisWeek,
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
                <div
                    className="card stat-card"
                    onClick={() => navigate("/contacts?filter=pending")}
                    style={{ cursor: "pointer" }}
                >
                    <Heart
                        size={24}
                        style={{
                            color: stats.pendingCount > 0 ? "var(--color-danger)" : "var(--color-success)",
                            marginBottom: "8px"
                        }}
                    />
                    <div
                        className="stat-value"
                        style={{
                            background: stats.pendingCount > 0
                                ? "linear-gradient(135deg, var(--color-danger), #f87171)"
                                : undefined,
                            WebkitBackgroundClip: stats.pendingCount > 0 ? "text" : undefined,
                            WebkitTextFillColor: stats.pendingCount > 0 ? "transparent" : undefined,
                        }}
                    >
                        {stats.pendingCount}
                    </div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="card stat-card">
                    <Bell size={24} style={{ color: "var(--color-warning)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.pendingReminders}</div>
                    <div className="stat-label">Reminders</div>
                </div>
                <div className="card stat-card">
                    <TrendingUp size={24} style={{ color: "var(--color-success)", marginBottom: "8px" }} />
                    <div className="stat-value">{stats.connectionsThisWeek}</div>
                    <div className="stat-label">This Week</div>
                </div>
            </div>

            {/* Pending Contacts Section */}
            {pendingContacts.length > 0 && (
                <section style={{ marginBottom: "var(--space-xl)" }}>
                    <h2 style={{
                        fontSize: "1.125rem",
                        marginBottom: "var(--space-md)",
                        color: "var(--color-danger)"
                    }}>
                        🔴 Pending Connections ({pendingContacts.length})
                    </h2>
                    <div className="flex flex-col gap-sm">
                        {pendingContacts.slice(0, 5).map((contact) => (
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

            {/* All Good State */}
            {contacts.length > 0 && pendingContacts.length === 0 && upcomingReminders.length === 0 && (
                <div className="empty-state">
                    <div style={{ fontSize: "4rem", marginBottom: "var(--space-md)" }}>🎉</div>
                    <h3 className="empty-state-title">All caught up!</h3>
                    <p className="empty-state-text">
                        You have no pending connections. Great job staying in touch!
                    </p>
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
