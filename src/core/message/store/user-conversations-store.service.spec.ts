import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { NIL as NilUUID } from "uuid";

import { UserConversationsStoreService } from "./user-conversations-store.service";
import { ConversationControllerService } from "../controller/conversation-controller.service";
import { MessageControllerService } from "../controller/message-controller.service";
import { MessageGatewayService } from "../gateway/message-gateway.service";
import { StatusGatewayService } from "../../status/gateway/status-gateway.service";
import { LocalSettingsService } from "../../../app/local-settings.service";
import { NGXLogger } from "ngx-logger";
import { Conversation } from "../model/conversation.model";
import { SenderData } from "../model/sender-data.model";
import { MessageType } from "../model/message-type.model";
import { Status } from "../../status/entity/status.entity";
import { SendingStatus } from "../../status/model/sending-status.model";
import { MessageFields } from "../entity/message.entity";
import { MockLogger, MockMessageGateway, MockStatusGateway, defer, drain } from "../../../testing";

class MockLocalSettings {
    autoMarkAsRead = false;
}

const noopRoute: Partial<ActivatedRoute> = {
    snapshot: { queryParamMap: { get: () => null } } as never,
};

function makeSenderText(text: string, to: string): SenderData {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: MessageType.text,
        text: { body: text } as never,
    };
}

function makeWsConfirm(realId: string, mpcId: string, sender: SenderData): Conversation {
    return {
        id: realId,
        sender_data: sender,
        from_id: NilUUID,
        to_id: mpcId,
        to: { id: mpcId } as never,
        messaging_product_id: "wa",
        created_at: new Date(),
        updated_at: new Date(),
    };
}

function makeStatus(messageId: string, status: SendingStatus): Status {
    return {
        message_id: messageId,
        product_data: {
            id: messageId,
            recipient_id: "0000",
            timestamp: "0",
            status,
        } as never,
        created_at: new Date(),
        updated_at: new Date(),
    } as unknown as Status;
}

const flush = drain;

describe("UserConversationsStoreService — concurrency", () => {
    let store: UserConversationsStoreService;
    let messageGw: MockMessageGateway;
    let statusGw: MockStatusGateway;
    let convoCtl: jasmine.SpyObj<ConversationControllerService>;
    let msgCtl: jasmine.SpyObj<MessageControllerService>;

    const MPC = "mpc-contact-1";
    const MPC2 = "mpc-contact-2";

    beforeEach(async () => {
        messageGw = new MockMessageGateway();
        statusGw = new MockStatusGateway();
        convoCtl = jasmine.createSpyObj<ConversationControllerService>(
            "ConversationControllerService",
            ["getByMessagingProductContact", "countByMessagingProductContact"],
        );
        convoCtl.getByMessagingProductContact.and.resolveTo([]);
        convoCtl.countByMessagingProductContact.and.resolveTo(0);
        msgCtl = jasmine.createSpyObj<MessageControllerService>("MessageControllerService", [
            "markConversationAsReadToUser",
            "sendTypingToUser",
        ]);
        msgCtl.markConversationAsReadToUser.and.resolveTo(undefined as never);
        msgCtl.sendTypingToUser.and.resolveTo(undefined as never);

        TestBed.configureTestingModule({
            providers: [
                UserConversationsStoreService,
                { provide: ConversationControllerService, useValue: convoCtl },
                { provide: MessageControllerService, useValue: msgCtl },
                { provide: MessageGatewayService, useValue: messageGw },
                { provide: StatusGatewayService, useValue: statusGw },
                { provide: LocalSettingsService, useClass: MockLocalSettings },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(UserConversationsStoreService);
        await store.initConditionally(noopRoute as ActivatedRoute, MPC);
    });

    function unsentLen(mpc = MPC): number {
        return store.unsentMessages.get(mpc)?.length ?? 0;
    }
    function historyLen(mpc = MPC): number {
        return store.messageHistory.get(mpc)?.length ?? 0;
    }
    function unsentIds(mpc = MPC): string[] {
        return (store.unsentMessages.get(mpc) ?? []).map(m => m.id);
    }
    function historyIds(mpc = MPC): string[] {
        return (store.messageHistory.get(mpc) ?? []).map(m => m.id);
    }

    describe("addUnsent", () => {
        it("places the optimistic message in unsent and emits on the bottom subject", async () => {
            const seen: Conversation[] = [];
            store.newBottomMessageFromConversations.get(MPC)!.subscribe(c => seen.push(c));

            const http = defer<MessageFields>();
            await store.addUnsent(makeSenderText("hi", MPC), MPC, http.promise);

            expect(unsentLen()).toBe(1);
            expect(seen.length).toBe(1);
            expect(seen[0].sender_data?.text).toEqual({ body: "hi" } as never);
            expect(seen[0].from_id).toBe(NilUUID);
        });

        it("isolates unsent lists per messagingProductContact", async () => {
            await Promise.all([
                store.addUnsent(makeSenderText("a", MPC), MPC),
                store.addUnsent(makeSenderText("b", MPC2), MPC2),
            ]);
            expect(unsentLen(MPC)).toBe(1);
            expect(unsentLen(MPC2)).toBe(1);
        });
    });

    describe("WS confirms agent-sent message — race vs HTTP", () => {
        it("WS arrives before HTTP — fallback evicts pending entry and adds to history", async () => {
            const http = defer<MessageFields>();
            const sender = makeSenderText("ping", MPC);
            await store.addUnsent(sender, MPC, http.promise);
            const fakeId = unsentIds()[0];

            const realId = "real-ping";
            await messageGw.emit(makeWsConfirm(realId, MPC, sender));

            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual([realId]);

            // HTTP resolves after the WS already cleaned up. The store should
            // detect that the entry is no longer pending and not reintroduce it.
            http.resolve({ id: realId } as MessageFields);
            await flush();
            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual([realId]);
            // The fakeId is gone too.
            expect(unsentIds().includes(fakeId)).toBe(false);
        });

        it("HTTP arrives before WS — entry stays in unsent under the real id, then WS removes it via id-first match", async () => {
            const http = defer<MessageFields>();
            const sender = makeSenderText("ping", MPC);
            await store.addUnsent(sender, MPC, http.promise);

            const realId = "real-ping";
            http.resolve({ id: realId } as MessageFields);
            await flush();

            // After HTTP, the unsent entry has been promoted to the real id and is no longer pending.
            expect(unsentIds()).toEqual([realId]);

            await messageGw.emit(makeWsConfirm(realId, MPC, sender));
            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual([realId]);
        });

        it("WS arrives without sender_data — does not call removeSent; goes straight to history", async () => {
            const http = defer<MessageFields>();
            await store.addUnsent(makeSenderText("ping", MPC), MPC, http.promise);
            const fakeId = unsentIds()[0];

            const incoming: Conversation = {
                id: "incoming-from-contact",
                from_id: "contact-mpc",
                to_id: NilUUID,
                from: { id: MPC } as never,
                messaging_product_id: "wa",
                created_at: new Date(),
                updated_at: new Date(),
            };
            await messageGw.emit(incoming);

            expect(unsentIds()).toEqual([fakeId]); // pending entry untouched
            expect(historyIds()).toEqual(["incoming-from-contact"]);
        });
    });

    describe("status arrival timing", () => {
        it("status arriving before HTTP (real id unknown locally) is dropped silently", async () => {
            const http = defer<MessageFields>();
            await store.addUnsent(makeSenderText("hi", MPC), MPC, http.promise);

            const realId = "real-hi";
            statusGw.emit(makeStatus(realId, SendingStatus.sent));

            // Status references the realId, but the unsent entry still has a fakeId.
            // Documents current behavior: the status is silently dropped.
            const pending = store.unsentMessages.get(MPC)![0];
            expect(pending.statuses).toBeUndefined();

            http.resolve({ id: realId } as MessageFields);
            await flush();
            const promoted = store.unsentMessages.get(MPC)![0];
            expect(promoted.id).toBe(realId);
            expect(promoted.statuses).toBeUndefined();
        });

        it("status arriving after HTTP but before WS is applied to the unsent entry", async () => {
            const http = defer<MessageFields>();
            await store.addUnsent(makeSenderText("hi", MPC), MPC, http.promise);

            const realId = "real-hi";
            http.resolve({ id: realId } as MessageFields);
            await flush();

            statusGw.emit(makeStatus(realId, SendingStatus.sent));

            const pending = store.unsentMessages.get(MPC)![0];
            expect(pending.id).toBe(realId);
            expect(pending.statuses?.length).toBe(1);
            expect(pending.statuses![0].product_data.status).toBe(SendingStatus.sent);
        });

        it("status before WS, then WS arrives, then HTTP arrives — message lands in history with no status", async () => {
            const http = defer<MessageFields>();
            const sender = makeSenderText("compose", MPC);
            await store.addUnsent(sender, MPC, http.promise);

            const realId = "real-compose";

            // Status arrives first — local store doesn't know the real id yet → dropped.
            statusGw.emit(makeStatus(realId, SendingStatus.delivered));

            // Then WS confirms the message (matches via fallback on sender_data).
            await messageGw.emit(makeWsConfirm(realId, MPC, sender));
            expect(historyIds()).toEqual([realId]);
            expect(historyLen()).toBe(1);
            const inHistory = store.messageHistory.get(MPC)![0];
            expect(inHistory.statuses).toBeUndefined();

            // Then HTTP resolves — must not reintroduce the entry.
            http.resolve({ id: realId } as MessageFields);
            await flush();
            expect(unsentLen()).toBe(0);
            expect(historyLen()).toBe(1);
        });

        it("orders statuses: lower order unshifts, equal/higher pushes", async () => {
            // Seed a message in history (no HTTP/WS races) and apply a sequence of statuses.
            const realId = "real-seed";
            const seed: Conversation = {
                id: realId,
                from_id: NilUUID,
                to_id: MPC,
                to: { id: MPC } as never,
                messaging_product_id: "wa",
                created_at: new Date(),
                updated_at: new Date(),
            };
            store.messageHistory.set(MPC, [seed]);

            // sent (3) onto empty → unshift via the empty-array fast path.
            statusGw.emit(makeStatus(realId, SendingStatus.sent));
            // delivered (2) < sent (3) → unshift.
            statusGw.emit(makeStatus(realId, SendingStatus.delivered));
            // read (1) < delivered (2) → unshift.
            statusGw.emit(makeStatus(realId, SendingStatus.read));
            // sent again (3) ≥ read (1) → push.
            statusGw.emit(makeStatus(realId, SendingStatus.sent));

            const statuses = store.messageHistory
                .get(MPC)![0]
                .statuses!.map(s => s.product_data.status);
            expect(statuses).toEqual([
                SendingStatus.read,
                SendingStatus.delivered,
                SendingStatus.sent,
                SendingStatus.sent,
            ]);
        });

        it("status for unknown message id is a no-op", () => {
            statusGw.emit(makeStatus("ghost", SendingStatus.sent));
            expect(historyLen()).toBe(0);
            expect(unsentLen()).toBe(0);
        });
    });

    describe("multiple in-flight messages", () => {
        it("WS for messages arriving in scrambled order all match correctly via fallback", async () => {
            const senders = [
                makeSenderText("m1", MPC),
                makeSenderText("m2", MPC),
                makeSenderText("m3", MPC),
            ];
            const promises = senders.map(() => defer<MessageFields>());
            for (let i = 0; i < senders.length; i++) {
                await store.addUnsent(senders[i], MPC, promises[i].promise);
            }
            expect(unsentLen()).toBe(3);

            // Drive WS for messages in arbitrary order — each must match exactly one entry.
            await messageGw.emit(makeWsConfirm("real-m2", MPC, senders[1]));
            await messageGw.emit(makeWsConfirm("real-m1", MPC, senders[0]));
            await messageGw.emit(makeWsConfirm("real-m3", MPC, senders[2]));

            expect(unsentLen()).toBe(0);
            // unshift-on-arrival means newest-first in history.
            expect(historyIds()).toEqual(["real-m3", "real-m1", "real-m2"]);
        });

        it("two messages with identical content: id-first match prevents fallback shadowing the wrong entry", async () => {
            // Send A first, then B with the same text. addUnsent unshifts, so
            // unsent ordering is [B(fake, pending), A(fake, pending)].
            const sender = makeSenderText("dup", MPC);
            const httpA = defer<MessageFields>();
            const httpB = defer<MessageFields>();
            await store.addUnsent(sender, MPC, httpA.promise);
            await store.addUnsent(sender, MPC, httpB.promise);
            expect(unsentLen()).toBe(2);

            // HTTP for A resolves first → A's entry is promoted to real-A and is no longer pending.
            httpA.resolve({ id: "real-A" } as MessageFields);
            await flush();
            // unsent is now [B(fake, pending), A(real-A, NOT pending)].

            // WS for A arrives — phase 1 (id-first) MUST find A, even though B
            // (matching content, pending) sits at the front of the queue.
            await messageGw.emit(makeWsConfirm("real-A", MPC, sender));
            expect(unsentIds().length).toBe(1);
            expect(unsentIds()[0]).not.toBe("real-A"); // B's fakeId still pending
            expect(historyIds()).toEqual(["real-A"]);

            // Now WS for B arrives — only B is pending; fallback removes it.
            await messageGw.emit(makeWsConfirm("real-B", MPC, sender));
            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual(["real-B", "real-A"]);

            // Resolving HTTP for B at the very end must be a clean no-op.
            httpB.resolve({ id: "real-B" } as MessageFields);
            await flush();
            expect(unsentLen()).toBe(0);
            expect(historyLen()).toBe(2);
        });

        it("two identical messages, no HTTP yet: each WS removes one pending entry via fallback", async () => {
            const sender = makeSenderText("twice", MPC);
            const httpA = defer<MessageFields>();
            const httpB = defer<MessageFields>();
            await store.addUnsent(sender, MPC, httpA.promise);
            await store.addUnsent(sender, MPC, httpB.promise);
            expect(unsentLen()).toBe(2);

            await messageGw.emit(makeWsConfirm("real-1", MPC, sender));
            expect(unsentLen()).toBe(1);
            await messageGw.emit(makeWsConfirm("real-2", MPC, sender));
            expect(unsentLen()).toBe(0);
            expect(historyIds().sort()).toEqual(["real-1", "real-2"].sort());

            // Both HTTPs resolving last must not reintroduce stale entries.
            httpA.resolve({ id: "real-1" } as MessageFields);
            httpB.resolve({ id: "real-2" } as MessageFields);
            await flush();
            expect(unsentLen()).toBe(0);
            expect(historyLen()).toBe(2);
        });

        it("HTTP-after-WS path cleans up duplicate when WS landed in history without matching unsent", async () => {
            // Construct the scenario described in the store: WS delivers a message
            // that did not match any pending unsent entry (different content), so it
            // landed straight in history. Meanwhile our pending entry has a real id
            // assigned by HTTP that *also* exists in history — duplicate.
            const sender = makeSenderText("hello", MPC);
            const http = defer<MessageFields>();
            await store.addUnsent(sender, MPC, http.promise);
            const fakeId = unsentIds()[0];

            // Inject a WS message with a *different* sender (so fallback misses) but
            // pretend the HTTP eventually resolves with this same id, simulating
            // the bookkeeping race.
            const realId = "real-hello";
            const wsMsg = makeWsConfirm(realId, MPC, makeSenderText("other", MPC));
            await messageGw.emit(wsMsg);
            // Fallback misses (sender_data differs), so entry stays pending and WS goes to history.
            expect(unsentIds()).toEqual([fakeId]);
            expect(historyIds()).toEqual([realId]);

            // HTTP resolves with the same realId. The store must detect the
            // duplicate-in-history and remove the unsent stale entry.
            http.resolve({ id: realId } as MessageFields);
            await flush();
            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual([realId]);
        });
    });

    describe("appendConversationIfAtBottom — offset gate", () => {
        it("when offset > 0 (user scrolled up) the WS message is not added to history; offset increments", async () => {
            await store.setOffset(MPC, 50);
            const sender = makeSenderText("scrolled", MPC);
            await messageGw.emit(makeWsConfirm("real-scrolled", MPC, sender));

            expect(historyLen()).toBe(0);
            expect(await store.getOffset(MPC)).toBe(51);
        });

        it("when offset === 0 the WS message is unshifted to history and emitted on the bottom subject", async () => {
            const seen: Conversation[] = [];
            store.newBottomMessageFromConversations.get(MPC)!.subscribe(c => seen.push(c));

            const sender = makeSenderText("bottom", MPC);
            await messageGw.emit(makeWsConfirm("real-bottom", MPC, sender));

            expect(historyIds()).toEqual(["real-bottom"]);
            expect(seen.length).toBe(1);
        });
    });

    describe("getTop / getBottom mutex serialization", () => {
        it("two concurrent getTop calls serialize and pass updated history.length to the controller on the second call", async () => {
            // First call returns 2 conversations, second returns 0 to terminate.
            convoCtl.getByMessagingProductContact.and.callFake(async (_id, _f, p) => {
                if (p?.offset === 0)
                    return [{ id: "h1" } as Conversation, { id: "h2" } as Conversation];
                return [];
            });

            await Promise.all([store.getTop(MPC), store.getTop(MPC)]);

            const calls = convoCtl.getByMessagingProductContact.calls.allArgs();
            const offsets = calls.map(c => c[2]?.offset).filter(o => typeof o === "number");
            // First call ran with offset 0; second saw history.length === 2 under the same lock.
            expect(offsets).toEqual([0, 2]);
            expect(historyIds()).toEqual(["h1", "h2"]);
        });

        it("getTop with empty result sets reachedMaxLimit and stops appending", async () => {
            convoCtl.getByMessagingProductContact.and.resolveTo([]);
            expect(await store.getReachedMaxLimit(MPC)).toBe(false);
            await store.getTop(MPC);
            expect(await store.getReachedMaxLimit(MPC)).toBe(true);
            expect(historyLen()).toBe(0);
        });

        it("getBottom decreases offset by paginationLimit (clamped at 0) and unshifts result", async () => {
            store.paginationLimit = 10;
            await store.setOffset(MPC, 4);

            convoCtl.getByMessagingProductContact.and.resolveTo([
                { id: "newer-1" } as Conversation,
                { id: "newer-2" } as Conversation,
            ]);

            await store.getBottom(MPC);
            expect(await store.getOffset(MPC)).toBe(0);
            const args = convoCtl.getByMessagingProductContact.calls.mostRecent().args;
            // Math.min(paginationLimit=10, offset=4) = 4
            expect(args[2]).toEqual(jasmine.objectContaining({ limit: 4, offset: 0 }));
            expect(historyIds()).toEqual(["newer-1", "newer-2"]);
        });

        it("resetHistory queued behind an in-flight getTop runs after getTop releases the mutex", async () => {
            // Hold getTop on its controller call so it owns getMutex when reset queues.
            const gate = defer<Conversation[]>();
            convoCtl.getByMessagingProductContact.and.returnValue(gate.promise);

            const top = store.getTop(MPC);
            await flush(); // let getTop reach `await getMutex.acquire` and the controller call
            const reset = store.resetHistory(MPC);
            await flush();
            // getTop holds getMutex; reset is parked. History is still empty.
            expect(historyLen()).toBe(0);

            // Resolve the controller. getTop appends "g1", releases the mutex,
            // then reset acquires and wipes.
            gate.resolve([{ id: "g1" } as Conversation]);
            await top;
            await reset;
            expect(historyLen()).toBe(0);
        });
    });

    describe("multi-MPC isolation under concurrency", () => {
        it("addUnsent on different MPCs in parallel does not block each other", async () => {
            const sA = makeSenderText("a", MPC);
            const sB = makeSenderText("b", MPC2);
            await Promise.all([store.addUnsent(sA, MPC), store.addUnsent(sB, MPC2)]);

            expect(unsentLen(MPC)).toBe(1);
            expect(unsentLen(MPC2)).toBe(1);

            // A WS confirmation for one MPC must not affect the other's queues.
            await messageGw.emit(makeWsConfirm("real-a", MPC, sA));
            expect(unsentLen(MPC)).toBe(0);
            expect(unsentLen(MPC2)).toBe(1);
        });
    });

    describe("addUnsent with no httpResponse argument", () => {
        it("WS confirmation still cleans up the optimistic entry via fallback", async () => {
            const sender = makeSenderText("no-http", MPC);
            await store.addUnsent(sender, MPC); // no httpResponse promise

            expect(unsentLen()).toBe(1);
            await messageGw.emit(makeWsConfirm("real-no-http", MPC, sender));
            expect(unsentLen()).toBe(0);
            expect(historyIds()).toEqual(["real-no-http"]);
        });
    });

    describe("initConditionally", () => {
        it("is idempotent: a second call with a different MPC reuses the existing init promise", async () => {
            // Already inited in beforeEach for MPC. A second call must not re-register
            // gateway watchers (otherwise WS callbacks would fire twice).
            const sender = makeSenderText("once", MPC);
            await store.initConditionally(noopRoute as ActivatedRoute, MPC2);

            // Send a WS message and confirm only one history entry results.
            await messageGw.emit(makeWsConfirm("real-once", MPC, sender));
            expect(historyLen()).toBe(1);
        });

        it("creates a bottom-message Subject per MPC even before init has fully resolved", async () => {
            expect(store.newBottomMessageFromConversations.get(MPC)).toBeDefined();
            await store.initConditionally(noopRoute as ActivatedRoute, MPC2);
            expect(store.newBottomMessageFromConversations.get(MPC2)).toBeDefined();
        });
    });
});
