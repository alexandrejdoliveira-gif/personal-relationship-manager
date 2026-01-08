// Database types for Personal Relationship Manager
export type RelationshipType =
    | "parent"
    | "sibling"
    | "child"
    | "spouse"
    | "grandparent"
    | "cousin"
    | "uncle_aunt"
    | "friend"
    | "colleague"
    | "acquaintance";

export interface PhoneNumber {
    label: string;
    number: string;
    isPrimary: boolean;
}

export interface Address {
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface CustomDate {
    label: string;
    date: string; // ISO date string
}

export interface ReminderConfig {
    enabled: boolean;
    intervalDays: number;
    preferredTime?: string;
    preferredDays?: number[];
}

export interface Contact {
    id: string;
    name: string;
    nickname?: string;
    relationship: RelationshipType;
    category: string;

    phones: PhoneNumber[];
    emails: string[];
    addresses: Address[];

    birthday?: string;
    anniversary?: string;
    customDates: CustomDate[];

    reminderConfig: ReminderConfig;

    notes: string;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export type InteractionType =
    | "call"
    | "video_call"
    | "text"
    | "email"
    | "visit"
    | "gift"
    | "card"
    | "other";

export interface Interaction {
    id: string;
    contactId: string;
    type: InteractionType;
    direction: "incoming" | "outgoing";
    timestamp: string;
    duration?: number;
    notes?: string;
    sentiment?: "positive" | "neutral" | "negative";
    source: "auto" | "manual";
}

export type ReminderType = "scheduled_call" | "birthday" | "anniversary" | "custom";
export type ActionType = "call" | "send_card" | "send_gift" | "visit" | "custom";

export interface Reminder {
    id: string;
    contactId: string;
    type: ReminderType;
    scheduledFor: string;
    status: "pending" | "triggered" | "completed" | "snoozed" | "dismissed";
    actionType: ActionType;
    actionData?: Record<string, unknown>;
    isRecurring: boolean;
    recurrenceRule?: string;
    createdAt: string;
    completedAt?: string;
}

export interface AppSettings {
    key: string;
    value: unknown;
}
