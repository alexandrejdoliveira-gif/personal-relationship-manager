import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { Contact, Interaction, Reminder, AppSettings } from "../types";

interface PRMDatabase extends DBSchema {
    contacts: {
        key: string;
        value: Contact;
        indexes: {
            "by_name": string;
            "by_category": string;
            "by_relationship": string;
        };
    };
    interactions: {
        key: string;
        value: Interaction;
        indexes: {
            "by_contact": string;
            "by_timestamp": string;
            "by_type": string;
        };
    };
    reminders: {
        key: string;
        value: Reminder;
        indexes: {
            "by_contact": string;
            "by_scheduled": string;
            "by_status": string;
        };
    };
    settings: {
        key: string;
        value: AppSettings;
    };
}

const DB_NAME = "prm_database";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PRMDatabase> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<PRMDatabase>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<PRMDatabase>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Contacts store
            if (!db.objectStoreNames.contains("contacts")) {
                const contactStore = db.createObjectStore("contacts", { keyPath: "id" });
                contactStore.createIndex("by_name", "name");
                contactStore.createIndex("by_category", "category");
                contactStore.createIndex("by_relationship", "relationship");
            }

            // Interactions store
            if (!db.objectStoreNames.contains("interactions")) {
                const interactionStore = db.createObjectStore("interactions", { keyPath: "id" });
                interactionStore.createIndex("by_contact", "contactId");
                interactionStore.createIndex("by_timestamp", "timestamp");
                interactionStore.createIndex("by_type", "type");
            }

            // Reminders store
            if (!db.objectStoreNames.contains("reminders")) {
                const reminderStore = db.createObjectStore("reminders", { keyPath: "id" });
                reminderStore.createIndex("by_contact", "contactId");
                reminderStore.createIndex("by_scheduled", "scheduledFor");
                reminderStore.createIndex("by_status", "status");
            }

            // Settings store
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "key" });
            }
        },
    });

    return dbInstance;
}

// Utility to generate UUIDs
export function generateId(): string {
    return crypto.randomUUID();
}
