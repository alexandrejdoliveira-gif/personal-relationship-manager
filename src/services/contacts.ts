import { getDatabase, generateId } from "./database";
import type { Contact, RelationshipType, ReminderConfig } from "../types";

const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
    enabled: true,
    intervalDays: 30,
    preferredTime: "09:00",
};

export async function getAllContacts(): Promise<Contact[]> {
    const db = await getDatabase();
    return db.getAll("contacts");
}

export async function getContactById(id: string): Promise<Contact | undefined> {
    const db = await getDatabase();
    return db.get("contacts", id);
}

export async function getContactsByCategory(category: string): Promise<Contact[]> {
    const db = await getDatabase();
    return db.getAllFromIndex("contacts", "by_category", category);
}

export async function getContactsByRelationship(relationship: RelationshipType): Promise<Contact[]> {
    const db = await getDatabase();
    return db.getAllFromIndex("contacts", "by_relationship", relationship);
}

export async function createContact(
    contactData: Omit<Contact, "id" | "createdAt" | "updatedAt" | "reminderConfig"> & {
        reminderConfig?: Partial<ReminderConfig>;
    }
): Promise<Contact> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const contact: Contact = {
        ...contactData,
        id: generateId(),
        reminderConfig: {
            ...DEFAULT_REMINDER_CONFIG,
            ...contactData.reminderConfig,
        },
        createdAt: now,
        updatedAt: now,
    };

    await db.put("contacts", contact);
    return contact;
}

export async function updateContact(
    id: string,
    updates: Partial<Omit<Contact, "id" | "createdAt">>
): Promise<Contact | undefined> {
    const db = await getDatabase();
    const existing = await db.get("contacts", id);

    if (!existing) return undefined;

    const updated: Contact = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await db.put("contacts", updated);
    return updated;
}

export async function deleteContact(id: string): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get("contacts", id);

    if (!existing) return false;

    await db.delete("contacts", id);
    return true;
}

export async function searchContacts(query: string): Promise<Contact[]> {
    const db = await getDatabase();
    const allContacts = await db.getAll("contacts");
    const lowerQuery = query.toLowerCase();

    return allContacts.filter(
        (contact) =>
            contact.name.toLowerCase().includes(lowerQuery) ||
            contact.nickname?.toLowerCase().includes(lowerQuery) ||
            contact.category.toLowerCase().includes(lowerQuery)
    );
}
