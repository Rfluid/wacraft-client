import { TestBed } from "@angular/core/testing";
import { NGXLogger } from "ngx-logger";
import { Subject } from "rxjs";

import { WebhookStoreService } from "./webhook-store.service";
import { WebhookControllerService } from "../controller/webhook-controller.service";
import { WorkspaceStoreService } from "../../workspace/store/workspace-store.service";
import { Webhook } from "../entity/webhook.entity";
import { HttpMethod } from "../../common/model/http-methods.model";
import { Event } from "../model/event.model";
import { MockLogger, defer, drain } from "../../../testing";

function webhook(id: string, url = `https://x/${id}`, event = Event.SendWhatsAppMessage): Webhook {
    return {
        id,
        url,
        http_method: HttpMethod.POST,
        timeout: 5000,
        event,
        signing_enabled: false,
        max_retries: 0,
        retry_delay_ms: 0,
        is_active: true,
        circuit_state: "closed",
        failure_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };
}

describe("WebhookStoreService", () => {
    let store: WebhookStoreService;
    let ctl: jasmine.SpyObj<WebhookControllerService>;
    let workspaceChanged: Subject<unknown>;

    beforeEach(() => {
        ctl = jasmine.createSpyObj<WebhookControllerService>("WebhookControllerService", [
            "get",
            "contentLike",
        ]);
        ctl.get.and.resolveTo([]);
        ctl.contentLike.and.resolveTo([]);

        workspaceChanged = new Subject();
        const workspaceStub = { workspaceChanged };

        TestBed.configureTestingModule({
            providers: [
                WebhookStoreService,
                { provide: WebhookControllerService, useValue: ctl },
                { provide: WorkspaceStoreService, useValue: workspaceStub },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(WebhookStoreService);
    });

    describe("get() pagination", () => {
        it("offsets the next call by current webhooks.length", async () => {
            ctl.get.and.callFake(async (_filter, paginate) => {
                if (paginate?.offset === 0) return [webhook("w1"), webhook("w2")];
                return [webhook("w3")];
            });

            await store.get();
            await store.get();
            expect(store.webhooks.map(w => w.id)).toEqual(["w1", "w2", "w3"]);
            expect(ctl.get.calls.allArgs().map(a => a[1]?.offset)).toEqual([0, 2]);
        });

        it("sets reachedMaxLimit on empty result", async () => {
            ctl.get.and.resolveTo([]);
            await store.get();
            expect(store.reachedMaxLimit).toBe(true);
        });

        it("serializes two concurrent get() calls", async () => {
            const gate = defer<Webhook[]>();
            ctl.get.and.callFake(async (_f, paginate) => {
                if (paginate?.offset === 0) return gate.promise;
                return [webhook("w3")];
            });

            const p1 = store.get();
            const p2 = store.get();
            await drain();

            gate.resolve([webhook("w1"), webhook("w2")]);
            await Promise.all([p1, p2]);

            expect(ctl.get.calls.allArgs().map(a => a[1]?.offset)).toEqual([0, 2]);
            expect(store.webhooks.map(w => w.id)).toEqual(["w1", "w2", "w3"]);
        });
    });

    describe("search pagination", () => {
        beforeEach(() => {
            store.searchValue = "needle";
        });

        it("getInitialSearch resets and appends", async () => {
            store.searchWebhooks = [webhook("stale")];
            ctl.contentLike.and.resolveTo([webhook("w1")]);
            await store.getInitialSearch();
            expect(store.searchWebhooks.map(w => w.id)).toEqual(["w1"]);
        });

        it("getSearch paginates by current length", async () => {
            ctl.contentLike.and.callFake(async (_q, _mode, _filter, paginate) => {
                if (paginate?.offset === 0) return [webhook("w1"), webhook("w2")];
                return [webhook("w3")];
            });

            await store.getInitialSearch();
            await store.getSearch();
            expect(store.searchWebhooks.map(w => w.id)).toEqual(["w1", "w2", "w3"]);
        });

        it("reachedMaxSearchLimit on empty", async () => {
            ctl.contentLike.and.resolveTo([]);
            await store.getInitialSearch();
            expect(store.reachedMaxSearchLimit).toBe(true);
        });
    });

    describe("getInitialSearchConcurrent — debounce", () => {
        it("collapses bursts into one trailing run", async () => {
            store.searchValue = "needle";
            const gate1 = defer<Webhook[]>();
            const gate2 = defer<Webhook[]>();
            let n = 0;
            ctl.contentLike.and.callFake(async () => {
                n++;
                return n === 1 ? gate1.promise : gate2.promise;
            });

            store.getInitialSearchConcurrent();
            await drain();
            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            expect(store.pendingExecution).toBe(true);

            gate1.resolve([]);
            await drain();
            expect(n).toBe(2);

            gate2.resolve([]);
            await drain();
            expect(store.isExecuting).toBe(false);
        });

        it("does nothing when searchValue is empty", () => {
            store.getInitialSearchConcurrent();
            expect(ctl.contentLike).not.toHaveBeenCalled();
        });
    });

    describe("CRUD under listMutex", () => {
        it("prependWebhook dedupes and places at front", async () => {
            store.webhooks = [webhook("w1"), webhook("w2")];
            await store.prependWebhook(webhook("w2", "https://x/renamed"));
            expect(store.webhooks.map(w => w.id)).toEqual(["w2", "w1"]);
            expect(store.webhooks[0].url).toContain("renamed");
        });

        it("prependWebhook mirrors into searchWebhooks when matches active search", async () => {
            store.searchValue = "alpha";
            store.searchMode = "url";
            await store.prependWebhook(webhook("a1", "https://alpha.example"));
            expect(store.searchWebhooks.map(w => w.id)).toEqual(["a1"]);
        });

        it("syncWebhook replaces in webhooks and searchWebhooks", async () => {
            store.webhooks = [webhook("w1", "old")];
            store.searchWebhooks = [webhook("w1", "old")];
            await store.syncWebhook(webhook("w1", "new"));
            expect(store.webhooks[0].url).toBe("new");
            expect(store.searchWebhooks[0].url).toBe("new");
        });

        it("removeWebhook drops from all stores", async () => {
            store.webhooks = [webhook("w1"), webhook("w2")];
            store.searchWebhooks = [webhook("w1")];
            store.webhooksById.set("w1", webhook("w1"));
            await store.removeWebhook("w1");
            expect(store.webhooks.map(w => w.id)).toEqual(["w2"]);
            expect(store.searchWebhooks).toEqual([]);
            expect(store.webhooksById.has("w1")).toBe(false);
        });
    });

    describe("getById caching", () => {
        it("returns cached webhook without controller call", async () => {
            store.webhooksById.set("w1", webhook("w1"));
            const result = await store.getById("w1");
            expect(result.id).toBe("w1");
            expect(ctl.get).not.toHaveBeenCalled();
        });

        it("fetches and caches on miss", async () => {
            ctl.get.and.resolveTo([webhook("w9")]);
            const result = await store.getById("w9");
            expect(result.id).toBe("w9");
            expect(store.webhooksById.get("w9")?.id).toBe("w9");
        });
    });

    describe("matchesCurrentSearch across modes", () => {
        it("http_method mode matches case-insensitively", async () => {
            store.searchValue = "post";
            store.searchMode = "http_method";
            await store.prependWebhook(webhook("w1"));
            expect(store.searchWebhooks.length).toBe(1);
        });

        it("event mode matches case-insensitively", async () => {
            store.searchValue = "RECEIVE";
            store.searchMode = "event";
            await store.prependWebhook(webhook("w1", "https://x", Event.ReceiveWhatsAppMessage));
            expect(store.searchWebhooks.length).toBe(1);
        });
    });

    describe("workspace change", () => {
        it("clears all state on workspaceChanged", () => {
            store.webhooks = [webhook("w1")];
            store.searchWebhooks = [webhook("w1")];
            store.webhooksById.set("w1", webhook("w1"));
            store.searchValue = "needle";
            store.reachedMaxLimit = true;

            workspaceChanged.next({});

            expect(store.webhooks).toEqual([]);
            expect(store.searchWebhooks).toEqual([]);
            expect(store.webhooksById.size).toBe(0);
            expect(store.searchValue).toBe("");
            expect(store.reachedMaxLimit).toBe(false);
        });
    });
});
