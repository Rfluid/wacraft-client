import { TestBed } from "@angular/core/testing";
import { NGXLogger } from "ngx-logger";
import { Subject } from "rxjs";

import { CampaignStoreService } from "./campaign-store.service";
import { CampaignControllerService } from "../controller/campaign-controller.service";
import { WorkspaceStoreService } from "../../workspace/store/workspace-store.service";
import { CampaignFields } from "../entity/campaign.entity";
import { MockLogger, defer, drain } from "../../../testing";

function campaign(id: string, name = id): CampaignFields {
    return {
        id,
        name,
        messaging_product_id: "wa",
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
    };
}

describe("CampaignStoreService", () => {
    let store: CampaignStoreService;
    let ctl: jasmine.SpyObj<CampaignControllerService>;
    let workspaceChanged: Subject<unknown>;

    beforeEach(() => {
        ctl = jasmine.createSpyObj<CampaignControllerService>("CampaignControllerService", [
            "get",
            "contentLike",
        ]);
        ctl.get.and.resolveTo([]);
        ctl.contentLike.and.resolveTo([]);

        workspaceChanged = new Subject();
        const workspaceStub = { workspaceChanged };

        TestBed.configureTestingModule({
            providers: [
                CampaignStoreService,
                { provide: CampaignControllerService, useValue: ctl },
                { provide: WorkspaceStoreService, useValue: workspaceStub },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(CampaignStoreService);
    });

    describe("get() pagination", () => {
        it("appends fetched campaigns and offsets the next call by current length", async () => {
            ctl.get.and.callFake(async (_filter, paginate) => {
                if (paginate?.offset === 0) return [campaign("c1"), campaign("c2")];
                return [campaign("c3")];
            });

            await store.get();
            expect(store.campaigns.map(c => c.id)).toEqual(["c1", "c2"]);

            await store.get();
            expect(store.campaigns.map(c => c.id)).toEqual(["c1", "c2", "c3"]);

            const offsets = ctl.get.calls.allArgs().map(a => a[1]?.offset);
            expect(offsets).toEqual([0, 2]);
        });

        it("sets reachedMaxLimit and stops appending when result is empty", async () => {
            ctl.get.and.resolveTo([]);
            await store.get();
            expect(store.reachedMaxLimit).toBe(true);
            expect(store.campaigns).toEqual([]);
        });

        it("populates campaignsById alongside the list", async () => {
            ctl.get.and.resolveTo([campaign("c1"), campaign("c2")]);
            await store.get();
            expect(store.campaignsById.get("c1")?.id).toBe("c1");
            expect(store.campaignsById.get("c2")?.id).toBe("c2");
        });

        it("serializes two concurrent get() calls — second uses updated length", async () => {
            const gate = defer<CampaignFields[]>();
            ctl.get.and.callFake(async (_filter, paginate) => {
                if (paginate?.offset === 0) return gate.promise;
                return [campaign("c3")];
            });

            const p1 = store.get();
            const p2 = store.get();
            await drain();

            // Resolve the first call. The second was queued behind the mutex,
            // so it must run with offset = current campaigns.length.
            gate.resolve([campaign("c1"), campaign("c2")]);
            await Promise.all([p1, p2]);

            const offsets = ctl.get.calls.allArgs().map(a => a[1]?.offset);
            expect(offsets).toEqual([0, 2]);
            expect(store.campaigns.map(c => c.id)).toEqual(["c1", "c2", "c3"]);
        });
    });

    describe("search pagination", () => {
        beforeEach(() => {
            store.searchValue = "needle";
        });

        it("getInitialSearch resets searchCampaigns then appends the first page", async () => {
            store.searchCampaigns = [campaign("stale")];
            ctl.contentLike.and.resolveTo([campaign("s1"), campaign("s2")]);

            await store.getInitialSearch();
            expect(store.searchCampaigns.map(c => c.id)).toEqual(["s1", "s2"]);
            expect(store.reachedMaxSearchLimit).toBe(false);
        });

        it("getInitialSearch sets reachedMaxSearchLimit when no results", async () => {
            ctl.contentLike.and.resolveTo([]);
            await store.getInitialSearch();
            expect(store.reachedMaxSearchLimit).toBe(true);
        });

        it("getSearch paginates by current searchCampaigns length", async () => {
            ctl.contentLike.and.callFake(async (_q, _mode, _filter, paginate) => {
                if (paginate?.offset === 0) return [campaign("s1"), campaign("s2")];
                return [campaign("s3")];
            });

            await store.getInitialSearch();
            await store.getSearch();
            expect(store.searchCampaigns.map(c => c.id)).toEqual(["s1", "s2", "s3"]);

            const offsets = ctl.contentLike.calls.allArgs().map(a => a[3]?.offset);
            expect(offsets).toEqual([0, 2]);
        });
    });

    describe("getInitialSearchConcurrent — debounce flags", () => {
        it("collapses bursts into one trailing run via pendingExecution", async () => {
            store.searchValue = "needle";
            const calls: number[] = [];
            const gate1 = defer<CampaignFields[]>();
            const gate2 = defer<CampaignFields[]>();
            ctl.contentLike.and.callFake(async () => {
                calls.push(performance.now());
                return calls.length === 1 ? gate1.promise : gate2.promise;
            });

            // First call kicks off execution.
            store.getInitialSearchConcurrent();
            await drain();
            expect(store.isExecuting).toBe(true);

            // Three more calls during the in-flight: they must be coalesced
            // into a single pendingExecution flag, not a queue of three.
            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            expect(store.pendingExecution).toBe(true);

            // Resolve the first run; the trailing run fires.
            gate1.resolve([]);
            await drain();
            expect(calls.length).toBe(2);
            expect(store.isExecuting).toBe(true);
            expect(store.pendingExecution).toBe(false);

            // Resolve the trailing run — no further runs queue.
            gate2.resolve([]);
            await drain();
            expect(calls.length).toBe(2);
            expect(store.isExecuting).toBe(false);
        });

        it("does nothing when searchValue is empty", () => {
            store.searchValue = "";
            store.getInitialSearchConcurrent();
            expect(ctl.contentLike).not.toHaveBeenCalled();
            expect(store.isExecuting).toBe(false);
        });

        it("clears isExecuting and still drains pending on rejection", async () => {
            store.searchValue = "needle";
            ctl.contentLike.and.rejectWith(new Error("net"));

            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent(); // trailing
            await drain();

            // After the failed first run, the trailing run should still be invoked.
            expect(ctl.contentLike.calls.count()).toBeGreaterThanOrEqual(2);
            await drain();
            expect(store.isExecuting).toBe(false);
        });
    });

    describe("CRUD under listMutex", () => {
        it("prependCampaign places the campaign at the front and dedupes existing ids", async () => {
            store.campaigns = [campaign("c1"), campaign("c2")];
            await store.prependCampaign(campaign("c2", "renamed"));
            expect(store.campaigns.map(c => c.id)).toEqual(["c2", "c1"]);
            expect(store.campaigns[0].name).toBe("renamed");
        });

        it("prependCampaign mirrors into searchCampaigns when it matches the active search", async () => {
            store.searchValue = "alpha";
            store.searchFilters = [];
            await store.prependCampaign(campaign("a1", "alpha-thing"));
            expect(store.searchCampaigns.map(c => c.id)).toEqual(["a1"]);
        });

        it("updateCampaignById replaces in both lists when present in either", async () => {
            store.campaigns = [campaign("c1", "old")];
            store.searchCampaigns = [campaign("c1", "old")];
            store.campaignsById.set("c1", campaign("c1", "old"));

            await store.updateCampaignById(campaign("c1", "new"));

            expect(store.campaigns[0].name).toBe("new");
            expect(store.searchCampaigns[0].name).toBe("new");
            expect(store.campaignsById.get("c1")?.name).toBe("new");
        });

        it("removeCampaign removes from all three stores", async () => {
            store.campaigns = [campaign("c1"), campaign("c2")];
            store.searchCampaigns = [campaign("c1")];
            store.campaignsById.set("c1", campaign("c1"));
            store.campaignsById.set("c2", campaign("c2"));

            await store.removeCampaign("c1");

            expect(store.campaigns.map(c => c.id)).toEqual(["c2"]);
            expect(store.searchCampaigns).toEqual([]);
            expect(store.campaignsById.has("c1")).toBe(false);
            expect(store.campaignsById.has("c2")).toBe(true);
        });

        it("CRUD operations queued behind an in-flight get() do not interleave", async () => {
            const gate = defer<CampaignFields[]>();
            ctl.get.and.returnValue(gate.promise);

            const fetching = store.get();
            const removing = store.removeCampaign("nope"); // queued
            await drain();
            expect(store.campaigns).toEqual([]);

            gate.resolve([campaign("c1"), campaign("c2")]);
            await fetching;
            await removing;
            expect(store.campaigns.map(c => c.id)).toEqual(["c1", "c2"]);
        });
    });

    describe("getById caching", () => {
        it("returns from cache without calling the controller", async () => {
            store.campaignsById.set("c1", campaign("c1"));
            const result = await store.getById("c1");
            expect(result.id).toBe("c1");
            expect(ctl.get).not.toHaveBeenCalled();
        });

        it("fetches and caches on miss", async () => {
            ctl.get.and.resolveTo([campaign("c9")]);
            const result = await store.getById("c9");
            expect(result.id).toBe("c9");
            expect(store.campaignsById.get("c9")?.id).toBe("c9");
            expect(ctl.get).toHaveBeenCalled();
        });
    });

    describe("workspace change", () => {
        it("clears all state when workspaceChanged emits", () => {
            store.campaigns = [campaign("c1")];
            store.searchCampaigns = [campaign("c1")];
            store.campaignsById.set("c1", campaign("c1"));
            store.reachedMaxLimit = true;
            store.reachedMaxSearchLimit = true;
            store.searchValue = "needle";

            workspaceChanged.next({});

            expect(store.campaigns).toEqual([]);
            expect(store.searchCampaigns).toEqual([]);
            expect(store.campaignsById.size).toBe(0);
            expect(store.reachedMaxLimit).toBe(false);
            expect(store.reachedMaxSearchLimit).toBe(false);
            expect(store.searchValue).toBe("");
        });
    });
});
