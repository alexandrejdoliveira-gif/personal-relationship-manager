import type { Reminder, Contact, Address } from "../types";
import { getContactById } from "./contacts";
import { completeReminder, snoozeReminder, dismissReminder, getDueReminders } from "./reminders";

interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

interface ActionableNotification {
    title: string;
    body: string;
    icon: string;
    tag: string;
    data: {
        contactId: string;
        reminderId: string;
        actionType: string;
        phoneNumber?: string;
        address?: Address;
    };
    actions: NotificationAction[];
}

// Check if notifications are supported and permitted
export async function checkNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
        return "denied";
    }
    return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
        return "denied";
    }

    if (Notification.permission === "granted") {
        return "granted";
    }

    if (Notification.permission !== "denied") {
        return await Notification.requestPermission();
    }

    return Notification.permission;
}

// Build notification based on reminder type
export async function buildNotification(reminder: Reminder): Promise<ActionableNotification | null> {
    const contact = await getContactById(reminder.contactId);
    if (!contact) return null;

    const baseNotification = {
        icon: contact.photoUrl || "/icons/icon-192.png",
        tag: reminder.id,
        data: {
            contactId: contact.id,
            reminderId: reminder.id,
            actionType: reminder.actionType,
            phoneNumber: reminder.actionData?.phoneNumber as string | undefined,
            address: reminder.actionData?.address as Address | undefined,
        },
    };

    switch (reminder.type) {
        case "scheduled_call":
            return {
                ...baseNotification,
                title: `Time to call ${contact.name}`,
                body: buildCallReminderBody(contact),
                actions: [
                    { action: "call", title: "📞 Call Now" },
                    { action: "snooze", title: "⏰ Snooze" },
                    { action: "complete", title: "✓ Done" },
                ],
            };

        case "birthday":
            return {
                ...baseNotification,
                title: `🎂 ${contact.name}'s Birthday!`,
                body: buildBirthdayBody(contact),
                actions: [
                    { action: "call", title: "📞 Call" },
                    { action: "view_address", title: "📍 Address" },
                    { action: "complete", title: "✓ Done" },
                ],
            };

        case "anniversary":
            return {
                ...baseNotification,
                title: `💐 ${contact.name}'s Anniversary`,
                body: `Don't forget to wish them well!`,
                actions: [
                    { action: "call", title: "📞 Call" },
                    { action: "send_card", title: "💌 Send Card" },
                    { action: "complete", title: "✓ Done" },
                ],
            };

        default:
            return {
                ...baseNotification,
                title: `Reminder: ${contact.name}`,
                body: "You have a scheduled reminder",
                actions: [
                    { action: "snooze", title: "⏰ Snooze" },
                    { action: "complete", title: "✓ Done" },
                ],
            };
    }
}

function buildCallReminderBody(contact: Contact): string {
    const parts: string[] = [];

    if (contact.relationship) {
        parts.push(`Your ${contact.relationship.replace("_", " ")}`);
    }

    const primaryPhone = contact.phones.find((p) => p.isPrimary)?.number || contact.phones[0]?.number;
    if (primaryPhone) {
        parts.push(`📱 ${primaryPhone}`);
    }

    return parts.join(" • ") || "Stay connected!";
}

function buildBirthdayBody(contact: Contact): string {
    const parts: string[] = [];

    if (contact.addresses.length > 0) {
        const addr = contact.addresses[0];
        parts.push(`📍 ${addr.city}, ${addr.state}`);
    }

    parts.push("Send birthday wishes!");

    return parts.join(" • ");
}

// Show notification
export async function showNotification(reminder: Reminder): Promise<boolean> {
    const permission = await checkNotificationPermission();
    if (permission !== "granted") return false;

    const notificationData = await buildNotification(reminder);
    if (!notificationData) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            tag: notificationData.tag,
            data: notificationData.data,
            requireInteraction: true,
        } as NotificationOptions);
        return true;
    } catch (error) {
        // Fallback to basic notification
        new Notification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            tag: notificationData.tag,
        });
        return true;
    }
}

// Handle notification action clicks
export async function handleNotificationAction(
    action: string,
    reminderId: string,
    data: ActionableNotification["data"]
): Promise<void> {
    switch (action) {
        case "call":
            if (data.phoneNumber) {
                window.open(`tel:${data.phoneNumber}`, "_self");
            }
            await completeReminder(reminderId);
            break;

        case "snooze":
            await snoozeReminder(reminderId, 60);
            break;

        case "complete":
            await completeReminder(reminderId);
            break;

        case "dismiss":
            await dismissReminder(reminderId);
            break;

        case "view_address":
            if (data.address) {
                const addressStr = encodeURIComponent(
                    `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.postalCode}`
                );
                window.open(`https://maps.google.com/maps?q=${addressStr}`, "_blank");
            }
            break;
    }
}

// Check for due reminders and show notifications
export async function processReminders(): Promise<void> {
    const dueReminders = await getDueReminders();

    for (const reminder of dueReminders) {
        await showNotification(reminder);
        // Update status to triggered
        await import("./reminders").then((m) =>
            m.updateReminder(reminder.id, { status: "triggered" })
        );
    }
}

// Start periodic reminder check
let reminderCheckInterval: number | null = null;

export function startReminderPolling(intervalMs: number = 60000): void {
    if (reminderCheckInterval) return;

    // Initial check
    processReminders();

    // Periodic check
    reminderCheckInterval = window.setInterval(processReminders, intervalMs);
}

export function stopReminderPolling(): void {
    if (reminderCheckInterval) {
        window.clearInterval(reminderCheckInterval);
        reminderCheckInterval = null;
    }
}
