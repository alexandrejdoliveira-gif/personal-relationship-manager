import { useState } from "react";
import { X } from "lucide-react";
import type { Contact, RelationshipType } from "../../types";
import { usePRMStore } from "../../store";

interface ContactFormProps {
    contact?: Contact;
    onClose: () => void;
    onSave?: (contact: Contact) => void;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Sibling" },
    { value: "child", label: "Child" },
    { value: "spouse", label: "Spouse" },
    { value: "grandparent", label: "Grandparent" },
    { value: "cousin", label: "Cousin" },
    { value: "uncle_aunt", label: "Uncle/Aunt" },
    { value: "friend", label: "Friend" },
    { value: "colleague", label: "Colleague" },
    { value: "acquaintance", label: "Acquaintance" },
];

const CATEGORY_OPTIONS = ["Family", "Friends", "Professional", "Other"];

export function ContactForm({ contact, onClose, onSave }: ContactFormProps) {
    const { addContact, updateContact } = usePRMStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: contact?.name || "",
        nickname: contact?.nickname || "",
        relationship: contact?.relationship || ("friend" as RelationshipType),
        category: contact?.category || "Friends",
        phone: contact?.phones[0]?.number || "",
        email: contact?.emails[0] || "",
        birthday: contact?.birthday || "",
        notes: contact?.notes || "",
        reminderEnabled: contact?.reminderConfig.enabled ?? true,
        reminderInterval: contact?.reminderConfig.intervalDays || 30,
        // Address fields
        street: contact?.addresses[0]?.street || "",
        city: contact?.addresses[0]?.city || "",
        state: contact?.addresses[0]?.state || "",
        postalCode: contact?.addresses[0]?.postalCode || "",
        country: contact?.addresses[0]?.country || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const contactData = {
                name: formData.name,
                nickname: formData.nickname || undefined,
                relationship: formData.relationship,
                category: formData.category,
                phones: formData.phone
                    ? [{ label: "Mobile", number: formData.phone, isPrimary: true }]
                    : [],
                emails: formData.email ? [formData.email] : [],
                addresses: formData.street
                    ? [
                        {
                            label: "Home",
                            street: formData.street,
                            city: formData.city,
                            state: formData.state,
                            postalCode: formData.postalCode,
                            country: formData.country,
                        },
                    ]
                    : [],
                birthday: formData.birthday || undefined,
                customDates: [],
                notes: formData.notes,
                reminderConfig: {
                    enabled: formData.reminderEnabled,
                    intervalDays: formData.reminderInterval,
                    preferredTime: "09:00",
                },
            };

            if (contact) {
                await updateContact(contact.id, contactData);
            } else {
                const newContact = await addContact(contactData);
                onSave?.(newContact);
            }

            onClose();
        } catch (error) {
            console.error("Failed to save contact:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {contact ? "Edit Contact" : "New Contact"}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nickname</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Relationship</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.relationship}
                                    onChange={(e) =>
                                        setFormData({ ...formData, relationship: e.target.value as RelationshipType })
                                    }
                                >
                                    {RELATIONSHIP_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORY_OPTIONS.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Birthday</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.birthday}
                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                placeholder="Street address"
                                style={{ marginBottom: "8px" }}
                            />
                            <div className="grid grid-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="City"
                                />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="State"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Personal notes about this contact..."
                            />
                        </div>

                        <div className="card" style={{ padding: "var(--space-md)" }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-sm)" }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>
                                    Enable Reminders
                                </label>
                                <input
                                    type="checkbox"
                                    checked={formData.reminderEnabled}
                                    onChange={(e) =>
                                        setFormData({ ...formData, reminderEnabled: e.target.checked })
                                    }
                                />
                            </div>
                            {formData.reminderEnabled && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Remind every (days)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min={1}
                                        max={365}
                                        value={formData.reminderInterval}
                                        onChange={(e) =>
                                            setFormData({ ...formData, reminderInterval: parseInt(e.target.value) || 30 })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : contact ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
