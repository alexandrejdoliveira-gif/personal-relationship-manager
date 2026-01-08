import { getDatabase, generateId } from "./database";
import type { Interaction, InteractionType } from "../types";

export async function getAllInteractions(): Promise<Interaction[]> {
    const db = await getDatabase();
    return db.getAll("interactions");
}

export async function getInteractionById(id: string): Promise<Interaction | undefined> {
    const db = await getDatabase();
    return db.get("interactions", id);
}

export async function getInteractionsByContact(contactId: string): Promise<Interaction[]> {
    const db = await getDatabase();
    return db.getAllFromIndex("interactions", "by_contact", contactId);
}

export async function getLastInteraction(contactId: string): Promise<Interaction | undefined> {
    const interactions = await getInteractionsByContact(contactId);
    if (interactions.length === 0) return undefined;

    return interactions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
}

export async function getDaysSinceLastInteraction(contactId: string): Promise<number | null> {
    const lastInteraction = await getLastInteraction(contactId);
    if (!lastInteraction) return null;

    const now = new Date();
    const lastDate = new Date(lastInteraction.timestamp);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

export async function logInteraction(
    interactionData: Omit<Interaction, "id">
): Promise<Interaction> {
    const db = await getDatabase();

    const interaction: Interaction = {
        ...interactionData,
        id: generateId(),
    };

    await db.put("interactions", interaction);
    return interaction;
}

export async function quickLogCall(
    contactId: string,
    direction: "incoming" | "outgoing",
    duration?: number,
    notes?: string
): Promise<Interaction> {
    return logInteraction({
        contactId,
        type: "call",
        direction,
        timestamp: new Date().toISOString(),
        duration,
        notes,
        source: "manual",
    });
}

export async function updateInteraction(
    id: string,
    updates: Partial<Omit<Interaction, "id">>
): Promise<Interaction | undefined> {
    const db = await getDatabase();
    const existing = await db.get("interactions", id);

    if (!existing) return undefined;

    const updated: Interaction = {
        ...existing,
        ...updates,
    };

    await db.put("interactions", updated);
    return updated;
}

export async function deleteInteraction(id: string): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get("interactions", id);

    if (!existing) return false;

    await db.delete("interactions", id);
    return true;
}

export async function getInteractionStats(contactId: string): Promise<{
    total: number;
    byType: Record<InteractionType, number>;
    lastInteraction: Interaction | undefined;
    daysSinceLast: number | null;
}> {
    const interactions = await getInteractionsByContact(contactId);
    const lastInteraction = await getLastInteraction(contactId);
    const daysSinceLast = await getDaysSinceLastInteraction(contactId);

    const byType: Record<InteractionType, number> = {
        call: 0,
        video_call: 0,
        text: 0,
        email: 0,
        visit: 0,
        gift: 0,
        card: 0,
        other: 0,
    };

    interactions.forEach((i) => {
        byType[i.type]++;
    });

    return {
        total: interactions.length,
        byType,
        lastInteraction,
        daysSinceLast,
    };
}
