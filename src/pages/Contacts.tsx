import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { usePRMStore } from "../store";
import { ContactCard, ContactForm } from "../components/contacts";
import { getDaysSinceLastInteraction } from "../services/interactions";

export function Contacts() {
    const navigate = useNavigate();
    const { contacts, loadContacts } = usePRMStore();
    const [showAddContact, setShowAddContact] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [contactDays, setContactDays] = useState<Record<string, number | null>>({});

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

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

    const categories = [...new Set(contacts.map((c) => c.category))];

    const filteredContacts = contacts.filter((contact) => {
        const matchesSearch =
            searchQuery === "" ||
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === null || contact.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Sort by days overdue (most overdue first), then by name
    const sortedContacts = [...filteredContacts].sort((a, b) => {
        const aDays = contactDays[a.id] ?? 0;
        const bDays = contactDays[b.id] ?? 0;
        const aOverdue = a.reminderConfig.enabled ? aDays - a.reminderConfig.intervalDays : -999;
        const bOverdue = b.reminderConfig.enabled ? bDays - b.reminderConfig.intervalDays : -999;

        if (aOverdue !== bOverdue) {
            return bOverdue - aOverdue;
        }
        return a.name.localeCompare(b.name);
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Contacts</h1>
                <p className="page-subtitle">{contacts.length} people in your network</p>
            </div>

            {/* Search */}
            <div className="form-group">
                <div style={{ position: "relative" }}>
                    <Search
                        size={18}
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--color-text-muted)",
                        }}
                    />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: "40px" }}
                    />
                </div>
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
                <div className="flex gap-sm mb-md" style={{ overflowX: "auto", paddingBottom: "8px" }}>
                    <button
                        className={`btn ${selectedCategory === null ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Contact List */}
            {sortedContacts.length > 0 ? (
                <div className="flex flex-col gap-sm">
                    {sortedContacts.map((contact) => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            daysSinceContact={contactDays[contact.id]}
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                        />
                    ))}
                </div>
            ) : contacts.length === 0 ? (
                <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <h3 className="empty-state-title">No contacts yet</h3>
                    <p className="empty-state-text">
                        Add your first contact to start managing your relationships.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={() => setShowAddContact(true)}>
                        <Plus size={20} />
                        Add Contact
                    </button>
                </div>
            ) : (
                <div className="empty-state">
                    <Search className="empty-state-icon" />
                    <h3 className="empty-state-title">No matches found</h3>
                    <p className="empty-state-text">Try adjusting your search or filter criteria.</p>
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={() => setShowAddContact(true)} title="Add Contact">
                <Plus size={24} />
            </button>

            {/* Add Contact Modal */}
            {showAddContact && <ContactForm onClose={() => setShowAddContact(false)} />}
        </div>
    );
}
