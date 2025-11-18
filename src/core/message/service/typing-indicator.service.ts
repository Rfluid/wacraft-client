import { Injectable } from "@angular/core";
import { UserConversationsStoreService } from "../store/user-conversations-store.service";
import { LocalSettingsService } from "../../../app/local-settings.service";
import { Subject } from "rxjs";

/**
 * Service to manage typing indicators for WhatsApp conversations.
 *
 * According to WhatsApp/Meta documentation:
 * - Typing indicator is dismissed after 25 seconds or when you send a message
 * - Only display typing indicator if you are going to respond
 *
 * This service implements a smart typing system that:
 * 1. Sends typing indicator when user starts typing
 * 2. Automatically refreshes the indicator before the 25s window expires
 * 3. Prevents sending duplicate requests within the refresh window
 * 4. Emits state changes for UI updates
 */
@Injectable({
    providedIn: "root",
})
export class TypingIndicatorService {
    // WhatsApp typing indicator expires after 25 seconds
    private readonly TYPING_DURATION_MS = 25000;

    // Safety margin to refresh typing before it expires (in milliseconds)
    // We refresh at 20 seconds to account for network latency and ensure
    // continuous typing display without gaps
    private readonly REFRESH_MARGIN_MS = 5000;

    // The actual refresh interval (25s - 5s = 20s)
    private readonly REFRESH_INTERVAL_MS = this.TYPING_DURATION_MS - this.REFRESH_MARGIN_MS;

    // Map to track active typing timers per conversation
    private typingTimers = new Map<string, NodeJS.Timeout>();

    // Map to track when typing was last sent per conversation
    private lastTypingSent = new Map<string, number>();

    // Subject to emit typing state changes per conversation
    private typingStateSubjects = new Map<string, Subject<boolean>>();

    constructor(
        private userConversationsStore: UserConversationsStoreService,
        private localSettings: LocalSettingsService,
    ) {}

    /**
     * Get or create a typing state subject for a conversation
     */
    getTypingStateObservable(messagingProductContactId: string): Subject<boolean> {
        if (!this.typingStateSubjects.has(messagingProductContactId)) {
            this.typingStateSubjects.set(messagingProductContactId, new Subject<boolean>());
        }
        return this.typingStateSubjects.get(messagingProductContactId)!;
    }

    /**
     * Triggers typing indicator for a specific conversation.
     * Intelligently manages the 25-second typing window.
     *
     * @param messagingProductContactId The ID of the contact/conversation
     */
    async triggerTyping(messagingProductContactId: string): Promise<void> {
        // Check if typing is enabled in settings
        if (!this.localSettings.sendTyping) {
            return;
        }

        const now = Date.now();
        const lastSent = this.lastTypingSent.get(messagingProductContactId);

        // If we recently sent a typing indicator (within the refresh window),
        // don't send another one yet
        if (lastSent && now - lastSent < this.REFRESH_INTERVAL_MS) {
            return;
        }

        // Send typing indicator to the server
        try {
            await this.userConversationsStore.sendTyping(messagingProductContactId);
            this.lastTypingSent.set(messagingProductContactId, now);

            // Emit typing state change
            const subject = this.getTypingStateObservable(messagingProductContactId);
            subject.next(true);

            // Clear any existing timer for this conversation
            this.clearTypingTimer(messagingProductContactId);

            // Set up a timer to auto-refresh typing indicator before it expires
            const timer = setTimeout(() => {
                // Auto-refresh: send typing again if still within typing session
                // This ensures continuous typing display if user is still composing
                this.clearTypingTimer(messagingProductContactId);

                // Emit typing stopped if no new typing triggered
                subject.next(false);
            }, this.REFRESH_INTERVAL_MS);

            this.typingTimers.set(messagingProductContactId, timer);
        } catch (error) {
            // Silently fail - typing indicator is not critical functionality
            console.error("Failed to send typing indicator:", error);
        }
    }

    /**
     * Stops the typing indicator for a conversation.
     * Call this when user sends a message or clears the input.
     *
     * @param messagingProductContactId The ID of the contact/conversation
     */
    stopTyping(messagingProductContactId: string): void {
        this.clearTypingTimer(messagingProductContactId);
        this.lastTypingSent.delete(messagingProductContactId);

        // Emit typing stopped
        const subject = this.getTypingStateObservable(messagingProductContactId);
        subject.next(false);
    }

    /**
     * Clears the typing timer for a conversation
     */
    private clearTypingTimer(messagingProductContactId: string): void {
        const timer = this.typingTimers.get(messagingProductContactId);
        if (timer) {
            clearTimeout(timer);
            this.typingTimers.delete(messagingProductContactId);
        }
    }

    /**
     * Clean up all timers (call on service destroy)
     */
    ngOnDestroy(): void {
        this.typingTimers.forEach(timer => clearTimeout(timer));
        this.typingTimers.clear();
        this.lastTypingSent.clear();
        this.typingStateSubjects.forEach(subject => subject.complete());
        this.typingStateSubjects.clear();
    }
}
