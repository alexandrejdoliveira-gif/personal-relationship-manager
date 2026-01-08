import { getDatabase, generateId } from "./database";
import type { Reminder, ReminderType, ActionType, Contact } from "../types";
import { getContactById } from "./contacts";
import { getDaysSinceLastInteraction } from "./interactions";

export async function getAllReminders(): Promise<Reminder[]> {
    const db = await getDatabase();
    return db.getAll("reminders");
}

export async function getReminderById(id: string): Promise<Reminder | undefined> {
    const db = await getDatabase();
    return db.get("reminders", id);
}

export async function getRemindersByContact(contactId: string): Promise<Reminder[]> {
    const db = await getDatabase();
    return db.getAllFromIndex("reminders", "by_contact", contactId);
}

export async function getPendingReminders(): Promise<Reminder[]> {
    const db = await getDatabase();
    return db.getAllFromIndex("reminders", "by_status", "pending");
}

export async function getDueReminders(): Promise<Reminder[]> {
    const pending = await getPendingReminders();
    const now = new Date();

    return pending.filter((r) => new Date(r.scheduledFor) <= now);
}

export async function getUpcomingReminders(days: number = 7): Promise<Reminder[]> {
    const pending = await getPendingReminders();
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return pending
        .filter((r) => {
            const scheduledDate = new Date(r.scheduledFor);
            return scheduledDate > now && scheduledDate <= future;
        })
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export async function createReminder(
    reminderData: Omit<Reminder, "id" | "createdAt" | "status"> & { status?: Reminder["status"] }
): Promise<Reminder> {
    const db = await getDatabase();

    const reminder: Reminder = {
        ...reminderData,
        id: generateId(),
        status: reminderData.status || "pending",
        createdAt: new Date().toISOString(),
    };

    await db.put("reminders", reminder);
    return reminder;
}

export async function updateReminder(
    id: string,
    updates: Partial<Omit<Reminder, "id" | "createdAt">>
): Promise<Reminder | undefined> {
    const db = await getDatabase();
    const existing = await db.get("reminders", id);

    if (!existing) return undefined;

    const updated: Reminder = {
        ...existing,
        ...updates,
    };

    await db.put("reminders", updated);
    return updated;
}

export async function completeReminder(id: string): Promise<Reminder | undefined> {
    return updateReminder(id, {
        status: "completed",
        completedAt: new Date().toISOString(),
    });
}

export async function snoozeReminder(id: string, minutes: number = 60): Promise<Reminder | undefined> {
    const existing = await getReminderById(id);
    if (!existing) return undefined;

    const newScheduledFor = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    return updateReminder(id, {
        status: "snoozed",
        scheduledFor: newScheduledFor,
    });
}

export async function dismissReminder(id: string): Promise<Reminder | undefined> {
    return updateReminder(id, { status: "dismissed" });
}

export async function deleteReminder(id: string): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get("reminders", id);

    if (!existing) return false;

    await db.delete("reminders", id);
    return true;
}

// Scheduler logic - calculate next reminder date
export async function calculateNextReminderDate(contact: Contact): Promise<Date | null> {
    if (!contact.reminderConfig.enabled) return null;

    const daysSinceLast = await getDaysSinceLastInteraction(contact.id);
    const { intervalDays, preferredTime } = contact.reminderConfig;

    let nextDate: Date;

    if (daysSinceLast === null || daysSinceLast >= intervalDays) {
        // Due now or overdue
        nextDate = new Date();
    } else {
        // Schedule for future
        const daysUntilDue = intervalDays - daysSinceLast;
        nextDate = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000);
    }

    // Set preferred time
    if (preferredTime) {
        const [hours, minutes] = preferredTime.split(":").map(Number);
        nextDate.setHours(hours, minutes, 0, 0);
    }

    return nextDate;
}

// Create or update automatic reminder for contact
export async function syncContactReminder(contactId: string): Promise<Reminder | null> {
    const contact = await getContactById(contactId);
    if (!contact || !contact.reminderConfig.enabled) return null;

    const existingReminders = await getRemindersByContact(contactId);
    const existingScheduled = existingReminders.find(
        (r) => r.type === "scheduled_call" && r.status === "pending"
    );

    const nextDate = await calculateNextReminderDate(contact);
    if (!nextDate) return null;

    if (existingScheduled) {
        // Update existing
        const updated = await updateReminder(existingScheduled.id, {
            scheduledFor: nextDate.toISOString(),
        });
        return updated || null;
    } else {
        // Create new
        const primaryPhone = contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;

        return createReminder({
            contactId,
            type: "scheduled_call",
            scheduledFor: nextDate.toISOString(),
            actionType: "call",
            actionData: primaryPhone ? { phoneNumber: primaryPhone } : undefined,
            isRecurring: true,
        });
    }
}

// Create birthday reminder
export async function createBirthdayReminder(contact: Contact): Promise<Reminder | null> {
    if (!contact.birthday) return null;

    const birthday = new Date(contact.birthday);
    const now = new Date();
    const thisYear = now.getFullYear();

    // Calculate next birthday
    let nextBirthday = new Date(thisYear, birthday.getMonth(), birthday.getDate(), 9, 0, 0);
    if (nextBirthday < now) {
        nextBirthday = new Date(thisYear + 1, birthday.getMonth(), birthday.getDate(), 9, 0, 0);
    }

    const address = contact.addresses[0];

    return createReminder({
        contactId: contact.id,
        type: "birthday",
        scheduledFor: nextBirthday.toISOString(),
        actionType: "send_card",
        actionData: address ? { address } : undefined,
        isRecurring: true,
        recurrenceRule: "FREQ=YEARLY",
    });
}
