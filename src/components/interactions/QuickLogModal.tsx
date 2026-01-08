import { useState } from "react";
import { X, Phone, MessageCircle, Video, Mail, Gift, Heart, Users } from "lucide-react";
import type { Contact, InteractionType } from "../../types";
import { usePRMStore } from "../../store";

interface QuickLogModalProps {
    contact: Contact;
    onClose: () => void;
}

const INTERACTION_TYPES: { type: InteractionType; icon: React.ReactNode; label: string }[] = [
    { type: "call", icon: <Phone size={20} />, label: "Phone Call" },
    { type: "video_call", icon: <Video size={20} />, label: "Video Call" },
    { type: "text", icon: <MessageCircle size={20} />, label: "Text Message" },
    { type: "email", icon: <Mail size={20} />, label: "Email" },
    { type: "visit", icon: <Users size={20} />, label: "In-Person Visit" },
    { type: "gift", icon: <Gift size={20} />, label: "Gift" },
    { type: "card", icon: <Heart size={20} />, label: "Card/Letter" },
];

export function QuickLogModal({ contact, onClose }: QuickLogModalProps) {
    const { logInteraction } = usePRMStore();
    const [selectedType, setSelectedType] = useState<InteractionType>("call");
    const [direction, setDirection] = useState<"outgoing" | "incoming">("outgoing");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await logInteraction({
                contactId: contact.id,
                type: selectedType,
                direction,
                timestamp: new Date().toISOString(),
                notes: notes || undefined,
                source: "manual",
            });
            onClose();
        } catch (error) {
            console.error("Failed to log interaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Log Interaction with {contact.name}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Interaction Type</label>
                            <div className="grid grid-2" style={{ gap: "var(--space-sm)" }}>
                                {INTERACTION_TYPES.map((item) => (
                                    <button
                                        key={item.type}
                                        type="button"
                                        className={`btn ${selectedType === item.type ? "btn-primary" : "btn-secondary"}`}
                                        onClick={() => setSelectedType(item.type)}
                                        style={{ justifyContent: "flex-start" }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(selectedType === "call" || selectedType === "video_call" || selectedType === "text" || selectedType === "email") && (
                            <div className="form-group">
                                <label className="form-label">Direction</label>
                                <div className="flex gap-sm">
                                    <button
                                        type="button"
                                        className={`btn ${direction === "outgoing" ? "btn-primary" : "btn-secondary"}`}
                                        onClick={() => setDirection("outgoing")}
                                        style={{ flex: 1 }}
                                    >
                                        📤 Outgoing
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${direction === "incoming" ? "btn-primary" : "btn-secondary"}`}
                                        onClick={() => setDirection("incoming")}
                                        style={{ flex: 1 }}
                                    >
                                        📥 Incoming
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Notes (optional)</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What did you talk about?"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Logging..." : "Log Interaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
