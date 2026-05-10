import { TestBed } from "@angular/core/testing";
import { NGXLogger } from "ngx-logger";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";

import { ConversationStoreService } from "./conversation-store.service";
import { ConversationControllerService } from "../controller/conversation-controller.service";
import { MessageControllerService } from "../controller/message-controller.service";
import { MessageGatewayService } from "../gateway/message-gateway.service";
import { StatusGatewayService } from "../../status/gateway/status-gateway.service";
import { LocalSettingsService } from "../../../app/local-settings.service";
import { MessagingProductContactFromMessagePipe } from "../pipe/messaging-product-contact-from-message.pipe";
import { MessagingProductContactControllerService } from "../../messaging-product/controller/messaging-product-contact-controller.service";
import { WorkspaceStoreService } from "../../workspace/store/workspace-store.service";
import { Conversation, ConversationMessagingProductContact } from "../model/conversation.model";
import { UnreadMode } from "../../local-config/model/unread-mode.model";
import { SendingStatus } from "../../status/model/sending-status.model";
import { Status } from "../../status/entity/status.entity";
import { MockLogger, MockMessageGateway, MockStatusGateway, defer, drain } from "../../../testing";

function contact(id: string, lastReadAt = new Date(0)): ConversationMessagingProductContact {
    return {
        id,
        last_read_at: lastReadAt,
        product_details: { phone_number: `${id}-phone` } as never,
        contact: { id: `c-${id}` } as never,
        messaging_product_id: "wa",
        contact_id: `c-${id}`,
        blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
    } as unknown as ConversationMessagingProductContact;
}

function message(id: string, fromContactId: string, createdAt = new Date()): Conversation {
    return {
        id,
        from_id: fromContactId,
        to_id: "agent",
        from: contact(fromContactId),
        messaging_product_id: "wa",
        created_at: createdAt,
        updated_at: createdAt,
    };
}

function makeStatus(messageId: string, status: SendingStatus): Status {
    return {
        message_id: messageId,
        product_data: { id: messageId, recipient_id: "0", timestamp: "0", status } as never,
        created_at: new Date(),
        updated_at: new Date(),
    } as unknown as Status;
}

class MockLocalSettings {
    unreadMode: UnreadMode = UnreadMode.NONE;
}

const noopRoute = {
    snapshot: { queryParams: {} as Record<string, string> },
} as unknown as ActivatedRoute;

describe("ConversationStoreService", () => {
    let store: ConversationStoreService;
    let convoCtl: jasmine.SpyObj<ConversationControllerService>;
    let msgCtl: jasmine.SpyObj<MessageControllerService>;
    let mpcCtl: jasmine.SpyObj<MessagingProductContactControllerService>;
    let messageGw: MockMessageGateway;
    let statusGw: MockStatusGateway;
    let workspaceChanged: Subject<unknown>;
    let localSettings: MockLocalSettings;

    beforeEach(() => {
        convoCtl = jasmine.createSpyObj<ConversationControllerService>(
            "ConversationControllerService",
            ["get", "count", "conversationContentLike", "countConversationContentLike"],
        );
        convoCtl.get.and.resolveTo([]);
        convoCtl.count.and.resolveTo(0);
        convoCtl.conversationContentLike.and.resolveTo([]);
        convoCtl.countConversationContentLike.and.resolveTo(0);

        msgCtl = jasmine.createSpyObj<MessageControllerService>("MessageControllerService", [
            "count",
            "contentLike",
            "countContentLike",
        ]);
        msgCtl.count.and.resolveTo(0);
        msgCtl.contentLike.and.resolveTo([]);
        msgCtl.countContentLike.and.resolveTo(0);

        mpcCtl = jasmine.createSpyObj<MessagingProductContactControllerService>(
            "MessagingProductContactControllerService",
            ["updateLastReadAt", "getLikeText", "countLikeText"],
        );
        mpcCtl.updateLastReadAt.and.resolveTo(undefined as never);
        mpcCtl.getLikeText.and.resolveTo([]);
        mpcCtl.countLikeText.and.resolveTo(0);

        messageGw = new MockMessageGateway();
        statusGw = new MockStatusGateway();
        workspaceChanged = new Subject();
        localSettings = new MockLocalSettings();

        TestBed.configureTestingModule({
            providers: [
                ConversationStoreService,
                MessagingProductContactFromMessagePipe,
                { provide: ConversationControllerService, useValue: convoCtl },
                { provide: MessageControllerService, useValue: msgCtl },
                { provide: MessagingProductContactControllerService, useValue: mpcCtl },
                { provide: MessageGatewayService, useValue: messageGw },
                { provide: StatusGatewayService, useValue: statusGw },
                { provide: LocalSettingsService, useValue: localSettings },
                { provide: WorkspaceStoreService, useValue: { workspaceChanged } },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(ConversationStoreService);
    });

    describe("init / initConditionally", () => {
        it("registers WS callbacks once and runs the initial get()", async () => {
            convoCtl.get.and.resolveTo([message("m1", "c1")]);
            await store.initConditionally(noopRoute);

            expect(messageGw.cb).toBeDefined();
            expect(convoCtl.get).toHaveBeenCalled();
            expect(store.conversations.length).toBe(1);
        });

        it("returns the same promise on subsequent calls (idempotent)", async () => {
            const a = store.initConditionally(noopRoute);
            const b = store.initConditionally(noopRoute);
            expect(a).toBe(b);
            await a;
        });
    });

    describe("get() pagination", () => {
        it("appends and offsets the next call by current length", async () => {
            convoCtl.get.and.callFake(async (_f, paginate) => {
                if (paginate?.offset === 0) return [message("m1", "c1"), message("m2", "c2")];
                return [message("m3", "c3")];
            });
            convoCtl.count.and.resolveTo(3);

            await store.get();
            expect(store.conversations.length).toBe(2);
            expect(store.count).toBe(3);

            await store.get();
            expect(store.conversations.length).toBe(3);
            const offsets = convoCtl.get.calls.allArgs().map(a => a[1]?.offset);
            expect(offsets).toEqual([0, 2]);
        });

        it("sets reachedMaxConversationLimit on empty result", async () => {
            convoCtl.get.and.resolveTo([]);
            await store.get();
            expect(store.reachedMaxConversationLimit).toBe(true);
        });

        it("populates conversationMap by contact id", async () => {
            convoCtl.get.and.resolveTo([message("m1", "c1"), message("m2", "c2")]);
            await store.get();
            expect(store.conversationMap.get("c1")).toBeDefined();
            expect(store.conversationMap.get("c2")).toBeDefined();
        });

        it("counts unread for SERVER mode messages newer than last_read_at", async () => {
            localSettings.unreadMode = UnreadMode.SERVER;
            const olderRead = new Date(2024, 0, 1);
            const msg = message("m1", "c1", new Date(2024, 5, 1));
            msg.from = contact("c1", olderRead);
            convoCtl.get.and.resolveTo([msg]);
            msgCtl.count.and.resolveTo(7);

            await store.get();
            expect(store.conversations[0].unread).toBe(7);
        });

        it("does NOT count unread for SERVER mode when message is older than last_read_at", async () => {
            localSettings.unreadMode = UnreadMode.SERVER;
            const recentRead = new Date(2024, 5, 1);
            const msg = message("m1", "c1", new Date(2024, 0, 1));
            msg.from = contact("c1", recentRead);
            convoCtl.get.and.resolveTo([msg]);

            await store.get();
            expect(store.conversations[0].unread).toBe(0);
            expect(msgCtl.count).not.toHaveBeenCalled();
        });

        it("does NOT count unread for non-SERVER mode regardless of timestamps", async () => {
            localSettings.unreadMode = UnreadMode.LOCAL;
            const olderRead = new Date(2024, 0, 1);
            const msg = message("m1", "c1", new Date(2024, 5, 1));
            msg.from = contact("c1", olderRead);
            convoCtl.get.and.resolveTo([msg]);

            await store.get();
            expect(msgCtl.count).not.toHaveBeenCalled();
        });
    });

    describe("unshiftConversation (WS new message)", () => {
        it("adds a new conversation at the front and registers it in the map", async () => {
            await store.unshiftConversation(message("m1", "c1"));
            expect(store.conversations.length).toBe(1);
            expect(store.conversations[0].contact.id).toBe("c1");
            expect(store.conversationMap.get("c1")).toBe(store.conversations[0]);
        });

        it("LOCAL mode: increments unread on existing conversation when new message arrives", async () => {
            localSettings.unreadMode = UnreadMode.LOCAL;
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c1"));
            expect(store.conversations.length).toBe(1);
            expect(store.conversations[0].unread).toBe(1);
        });

        it("SERVER mode: increments unread on existing conversation", async () => {
            localSettings.unreadMode = UnreadMode.SERVER;
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c1"));
            expect(store.conversations[0].unread).toBe(1);
        });

        it("NONE mode: does not increment unread on existing conversation", async () => {
            localSettings.unreadMode = UnreadMode.NONE;
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c1"));
            expect(store.conversations[0].unread).toBe(0);
        });

        it("preserves accumulated unread count when re-unshifting an existing conversation", async () => {
            localSettings.unreadMode = UnreadMode.LOCAL;
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c1"));
            await store.unshiftConversation(message("m3", "c1"));
            expect(store.conversations[0].unread).toBe(2);
        });

        it("moves an existing conversation to the front on a new arrival", async () => {
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c2"));
            await store.unshiftConversation(message("m3", "c1"));
            expect(store.conversations.map(c => c.contact.id)).toEqual(["c1", "c2"]);
        });

        it("WS message via gateway flows through unshiftConversation", async () => {
            await store.initConditionally(noopRoute);
            await messageGw.emit(message("m1", "c1"));
            expect(store.conversations.length).toBe(1);
        });

        it("WS message for the currently open conversation triggers read()", async () => {
            const route = {
                snapshot: { queryParams: { "messaging_product_contact.id": "c1" } },
            } as unknown as ActivatedRoute;
            localSettings.unreadMode = UnreadMode.SERVER;
            await store.initConditionally(route);
            await store.unshiftConversation(message("m1", "c1"));
            await messageGw.emit(message("m2", "c1"));
            expect(mpcCtl.updateLastReadAt).toHaveBeenCalledWith("c1");
        });
    });

    describe("read()", () => {
        it("resets unread counter on the matching conversation", async () => {
            localSettings.unreadMode = UnreadMode.LOCAL;
            await store.unshiftConversation(message("m1", "c1"));
            await store.unshiftConversation(message("m2", "c1"));
            expect(store.conversations[0].unread).toBe(1);

            store.read("c1");
            expect(store.conversations[0].unread).toBe(0);
        });

        it("calls updateLastReadAt only in SERVER mode", async () => {
            localSettings.unreadMode = UnreadMode.SERVER;
            await store.unshiftConversation(message("m1", "c1"));
            store.read("c1");
            expect(mpcCtl.updateLastReadAt).toHaveBeenCalledWith("c1");

            mpcCtl.updateLastReadAt.calls.reset();
            localSettings.unreadMode = UnreadMode.LOCAL;
            await store.unshiftConversation(message("m2", "c2"));
            store.read("c2");
            expect(mpcCtl.updateLastReadAt).not.toHaveBeenCalled();
        });

        it("is a no-op for an unknown contact id", () => {
            store.read("ghost");
            expect(mpcCtl.updateLastReadAt).not.toHaveBeenCalled();
        });
    });

    describe("status WS integration", () => {
        async function seedConversation(msgId: string, contactId: string) {
            convoCtl.get.and.resolveTo([message(msgId, contactId)]);
            await store.initConditionally(noopRoute);
        }

        it("applies a status to the matching conversation message", async () => {
            await seedConversation("m1", "c1");
            statusGw.emit(makeStatus("m1", SendingStatus.sent));

            const m = store.conversations[0].message;
            expect(m.statuses?.length).toBe(1);
            expect(m.statuses![0].product_data.status).toBe(SendingStatus.sent);
        });

        it("applies the status-order rules: lower order unshifts, higher pushes", async () => {
            await seedConversation("m1", "c1");
            statusGw.emit(makeStatus("m1", SendingStatus.sent));
            statusGw.emit(makeStatus("m1", SendingStatus.delivered));
            statusGw.emit(makeStatus("m1", SendingStatus.read));
            statusGw.emit(makeStatus("m1", SendingStatus.sent));

            const seq = store.conversations[0].message.statuses!.map(s => s.product_data.status);
            expect(seq).toEqual([
                SendingStatus.read,
                SendingStatus.delivered,
                SendingStatus.sent,
                SendingStatus.sent,
            ]);
        });

        it("ignores statuses for unknown messages", async () => {
            await seedConversation("m1", "c1");
            statusGw.emit(makeStatus("ghost", SendingStatus.sent));
            expect(store.conversations[0].message.statuses).toBeUndefined();
        });
    });

    describe("getInitialSearch / getSearchConversations", () => {
        beforeEach(() => {
            store.searchValue = "needle";
        });

        it("getInitialSearch in message mode without filter calls messageController.contentLike", async () => {
            store.searchMode = "message";
            store.messagingProductContactIdFilter = undefined;
            msgCtl.contentLike.and.resolveTo([message("m1", "c1")]);

            await store.getInitialSearch();
            expect(msgCtl.contentLike).toHaveBeenCalled();
            expect(store.searchConversations.length).toBe(1);
        });

        it("getInitialSearch in message mode with filter uses conversationContentLike", async () => {
            store.searchMode = "message";
            store.messagingProductContactIdFilter = "c1";
            convoCtl.conversationContentLike.and.resolveTo([message("m1", "c1")]);

            await store.getInitialSearch();
            expect(convoCtl.conversationContentLike).toHaveBeenCalled();
            expect(msgCtl.contentLike).not.toHaveBeenCalled();
        });

        it("getInitialSearch in contact mode synthesizes message stubs from MPC list", async () => {
            store.searchMode = "contact";
            const c = contact("c-found");
            mpcCtl.getLikeText.and.resolveTo([c]);

            await store.getInitialSearch();
            expect(store.searchConversations.length).toBe(1);
            expect(store.searchConversations[0].to_id).toBe("c-found");
        });

        it("getInitialSearch sets reachedMaxSearchConversationLimit on empty", async () => {
            msgCtl.contentLike.and.resolveTo([]);
            await store.getInitialSearch();
            expect(store.reachedMaxSearchConversationLimit).toBe(true);
        });

        it("getSearchConversations paginates by current length", async () => {
            store.searchMode = "message";
            msgCtl.contentLike.and.callFake(async (_q, _f, paginate) => {
                if (paginate?.offset === 0) return [message("m1", "c1")];
                return [message("m2", "c2")];
            });

            await store.getInitialSearch();
            await store.getSearchConversations();
            expect(store.searchConversations.length).toBe(2);
            expect(msgCtl.contentLike.calls.allArgs().map(a => a[2]?.offset)).toEqual([0, 1]);
        });
    });

    describe("getInitialSearchConcurrent — debounce", () => {
        it("does nothing when searchValue is empty", () => {
            store.searchValue = "";
            store.getInitialSearchConcurrent();
            expect(msgCtl.contentLike).not.toHaveBeenCalled();
        });

        it("collapses bursts into one trailing run", async () => {
            store.searchValue = "needle";
            store.searchMode = "message";
            const gate1 = defer<Conversation[]>();
            const gate2 = defer<Conversation[]>();
            let n = 0;
            msgCtl.contentLike.and.callFake(async () => {
                n++;
                return n === 1 ? gate1.promise : gate2.promise;
            });

            store.getInitialSearchConcurrent();
            await drain();
            expect(store.isExecuting).toBe(true);

            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            expect(store.pendingExecution).toBe(true);

            gate1.resolve([]);
            await drain();
            expect(n).toBe(2);
            expect(store.pendingExecution).toBe(false);

            gate2.resolve([]);
            await drain();
            expect(store.isExecuting).toBe(false);
        });

        it("clears isExecuting on rejection and still drains pending", async () => {
            store.searchValue = "needle";
            store.searchMode = "message";
            msgCtl.contentLike.and.rejectWith(new Error("net"));

            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            await drain();
            expect(store.isExecuting).toBe(false);
        });
    });

    describe("addFilter / removeFilter", () => {
        it("addFilter appends and triggers concurrent search", () => {
            store.searchValue = "needle";
            store.addFilter({ text: "f1" });
            expect(store.searchFilters.map(f => f.text)).toEqual(["f1"]);
            // searchValue is set, so concurrent search should run.
            expect(store.isExecuting).toBe(true);
        });

        it("addFilter sets messagingProductContactIdFilter when provided", () => {
            store.addFilter({ text: "f1" }, "c1");
            expect(store.messagingProductContactIdFilter).toBe("c1");
        });

        it("removeFilter clears messagingProductContactIdFilter and removes the filter", () => {
            store.searchFilters = [{ text: "f1" }, { text: "f2" }];
            store.messagingProductContactIdFilter = "c1";
            store.removeFilter({ text: "f1" });
            expect(store.searchFilters.map(f => f.text)).toEqual(["f2"]);
            expect(store.messagingProductContactIdFilter).toBeUndefined();
        });
    });

    describe("workspace change → resetState", () => {
        it("clears conversations, map, search, counts, and initPromise", async () => {
            convoCtl.get.and.resolveTo([message("m1", "c1")]);
            await store.initConditionally(noopRoute);
            expect(store.conversations.length).toBe(1);

            workspaceChanged.next({});

            expect(store.conversations).toEqual([]);
            expect(store.conversationMap.size).toBe(0);
            expect(store.searchConversations).toEqual([]);
            expect(store.reachedMaxConversationLimit).toBe(false);
            expect(store.reachedMaxSearchConversationLimit).toBe(false);
            expect(store.count).toBe(0);
            expect(store.searchCount).toBe(0);
            expect(store.searchValue).toBe("");

            // initConditionally should re-init now that initPromise is null.
            convoCtl.get.calls.reset();
            convoCtl.get.and.resolveTo([]);
            await store.initConditionally(noopRoute);
            expect(convoCtl.get).toHaveBeenCalled();
        });
    });
});
