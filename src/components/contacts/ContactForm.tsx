import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Contact, RelationshipType } from "../../types";
import { usePRMStore } from "../../store";

interface ContactFormProps {
    contact?: Contact;
    onClose: () => void;
    onSave?: (contact: Contact) => void;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
    { value: "spouse", label: "Spouse" },
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Sibling" },
    { value: "child", label: "Child" },
    { value: "grandparent", label: "Grandparent" },
    { value: "cousin", label: "Cousin" },
    { value: "uncle_aunt", label: "Uncle/Aunt" },
    { value: "friend", label: "Friend" },
    { value: "colleague", label: "Colleague" },
    { value: "acquaintance", label: "Acquaintance" },
];

export function ContactForm({ contact, onClose, onSave }: ContactFormProps) {
    const { addContact, updateContact } = usePRMStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: contact?.name || "",
        relationship: contact?.relationship || ("spouse" as RelationshipType),
        phone: contact?.phones[0]?.number || "",
        birthday: contact?.birthday || "",
        notes: contact?.notes || "",
        reminderInterval: contact?.reminderConfig.intervalDays || 1,
        // Address fields
        street: contact?.addresses[0]?.street || "",
        aptUnit: "",
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
                nickname: undefined,
                relationship: formData.relationship,
                category: "Family",
                phones: formData.phone
                    ? [{ label: "Mobile", number: formData.phone, isPrimary: true }]
                    : [],
                emails: [],
                addresses: formData.street
                    ? [
                        {
                            label: "Home",
                            street: formData.aptUnit
                                ? `${formData.street}, ${formData.aptUnit}`
                                : formData.street,
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
                    enabled: true,
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
                <div className="modal-header-enhanced">
                    <div className="flex items-center" style={{ gap: "var(--space-md)" }}>
                        <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            onClick={onClose}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="modal-title">
                            {contact ? "Edit Contact" : "New Contact"}
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.birthday}
                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            />
                        </div>

                        {/* Relation + Frequency */}
                        <div className="grid grid-2" style={{ gap: "var(--space-md)" }}>
                            <div className="form-group">
                                <label className="form-label">Relation</label>
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
                                <label className="form-label">Frequency (Days)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min={1}
                                    max={365}
                                    value={formData.reminderInterval}
                                    onChange={(e) =>
                                        setFormData({ ...formData, reminderInterval: parseInt(e.target.value) || 1 })
                                    }
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="form-group">
                            <div className="form-section-header">
                                <MapPin size={14} />
                                <span>Address</span>
                            </div>

                            {/* Street */}
                            <input
                                type="text"
                                className="form-input"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                placeholder="Street address"
                                style={{ marginBottom: "var(--space-sm)" }}
                            />

                            {/* Apt/Suite/Unit */}
                            <input
                                type="text"
                                className="form-input"
                                value={formData.aptUnit}
                                onChange={(e) => setFormData({ ...formData, aptUnit: e.target.value })}
                                placeholder="Apt, suite, unit (optional)"
                                style={{ marginBottom: "var(--space-sm)" }}
                            />

                            {/* City + State */}
                            <div className="grid grid-2" style={{ gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
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

                            {/* Postal Code + Country */}
                            <div className="grid grid-2" style={{ gap: "var(--space-sm)" }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.postalCode}
                                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    placeholder="Postal code"
                                />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="Country"
                                />
                            </div>
                        </div>

                        {/* Notes */}
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
