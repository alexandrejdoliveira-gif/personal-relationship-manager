import { create } from "zustand";
import type { Contact, Interaction, Reminder } from "../types";
import * as contactsService from "../services/contacts";
import * as interactionsService from "../services/interactions";
import * as remindersService from "../services/reminders";

interface PRMState {
    // Data
    contacts: Contact[];
    interactions: Interaction[];
    reminders: Reminder[];

    // UI State
    isLoading: boolean;
    error: string | null;
    selectedContactId: string | null;

    // Contact Actions
    loadContacts: () => Promise<void>;
    addContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt" | "reminderConfig"> & { reminderConfig?: Partial<Contact["reminderConfig"]> }) => Promise<Contact>;
    updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    selectContact: (id: string | null) => void;

    // Interaction Actions
    loadInteractions: (contactId?: string) => Promise<void>;
    logInteraction: (interaction: Omit<Interaction, "id">) => Promise<Interaction>;
    quickLogCall: (contactId: string, direction: "incoming" | "outgoing", duration?: number, notes?: string) => Promise<void>;

    // Reminder Actions
    loadReminders: () => Promise<void>;
    completeReminder: (id: string) => Promise<void>;
    snoozeReminder: (id: string, minutes?: number) => Promise<void>;
    dismissReminder: (id: string) => Promise<void>;
}

export const usePRMStore = create<PRMState>((set, get) => ({
    // Initial State
    contacts: [],
    interactions: [],
    reminders: [],
    isLoading: false,
    error: null,
    selectedContactId: null,

    // Contact Actions
    loadContacts: async () => {
        set({ isLoading: true, error: null });
        try {
            const contacts = await contactsService.getAllContacts();
            set({ contacts, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addContact: async (contactData) => {
        set({ isLoading: true, error: null });
        try {
            const contact = await contactsService.createContact(contactData);
            set((state) => ({
                contacts: [...state.contacts, contact],
                isLoading: false,
            }));
            // Sync reminder for new contact
            await remindersService.syncContactReminder(contact.id);
            if (contact.birthday) {
                await remindersService.createBirthdayReminder(contact);
            }
            // Reload reminders
            await get().loadReminders();
            return contact;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateContact: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await contactsService.updateContact(id, updates);
            if (updated) {
                set((state) => ({
                    contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
                    isLoading: false,
                }));
                // Re-sync reminder
                await remindersService.syncContactReminder(id);
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    deleteContact: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await contactsService.deleteContact(id);
            set((state) => ({
                contacts: state.contacts.filter((c) => c.id !== id),
                selectedContactId: state.selectedContactId === id ? null : state.selectedContactId,
                isLoading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    selectContact: (id) => set({ selectedContactId: id }),

    // Interaction Actions
    loadInteractions: async (contactId) => {
        set({ isLoading: true, error: null });
        try {
            const interactions = contactId
                ? await interactionsService.getInteractionsByContact(contactId)
                : await interactionsService.getAllInteractions();
            set({ interactions, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    logInteraction: async (interactionData) => {
        set({ isLoading: true, error: null });
        try {
            const interaction = await interactionsService.logInteraction(interactionData);
            set((state) => ({
                interactions: [interaction, ...state.interactions],
                isLoading: false,
            }));
            // Re-sync reminder after interaction
            await remindersService.syncContactReminder(interaction.contactId);
            await get().loadReminders();
            return interaction;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    quickLogCall: async (contactId, direction, duration, notes) => {
        await interactionsService.quickLogCall(contactId, direction, duration, notes);
        await get().loadInteractions(contactId);
        await remindersService.syncContactReminder(contactId);
        await get().loadReminders();
    },

    // Reminder Actions
    loadReminders: async () => {
        set({ isLoading: true, error: null });
        try {
            const reminders = await remindersService.getAllReminders();
            set({ reminders, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    completeReminder: async (id) => {
        await remindersService.completeReminder(id);
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.id === id ? { ...r, status: "completed" as const, completedAt: new Date().toISOString() } : r
            ),
        }));
    },

    snoozeReminder: async (id, minutes = 60) => {
        await remindersService.snoozeReminder(id, minutes);
        const newScheduledFor = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.id === id ? { ...r, status: "snoozed" as const, scheduledFor: newScheduledFor } : r
            ),
        }));
    },

    dismissReminder: async (id) => {
        await remindersService.dismissReminder(id);
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.id === id ? { ...r, status: "dismissed" as const } : r
            ),
        }));
    },
}));
