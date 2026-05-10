import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";

import { TemplateStoreService } from "./template-store.service";
import { TemplateControllerService } from "../controller/template-controller.service";
import { WorkspaceStoreService } from "../../workspace/store/workspace-store.service";
import { Template, TemplateCategory, TemplateStatus } from "../model/template.model";
import { TemplateQualityScore } from "../model/template-query-params.model";
import { GetTemplateResponse } from "../model/get-response.model";
import { defer, drain } from "../../../testing";

function template(name: string, id = `id-${name}`): Template {
    return {
        id,
        name,
        components: [],
    };
}

function makeResponse(
    data: Template[],
    after: string | undefined = undefined,
    totalCount: number | "no-summary" = data.length,
): GetTemplateResponse {
    return {
        data,
        paging: { cursors: { after } },
        summary: totalCount === "no-summary" ? undefined : { total_count: totalCount },
    };
}

describe("TemplateStoreService", () => {
    let store: TemplateStoreService;
    let ctl: jasmine.SpyObj<TemplateControllerService>;
    let workspaceChanged: Subject<unknown>;

    beforeEach(() => {
        ctl = jasmine.createSpyObj<TemplateControllerService>("TemplateControllerService", ["get"]);
        ctl.get.and.resolveTo(makeResponse([]));

        workspaceChanged = new Subject();
        const workspaceStub = { workspaceChanged };

        TestBed.configureTestingModule({
            providers: [
                TemplateStoreService,
                { provide: TemplateControllerService, useValue: ctl },
                { provide: WorkspaceStoreService, useValue: workspaceStub },
            ],
        });
        store = TestBed.inject(TemplateStoreService);
    });

    describe("getByName", () => {
        it("returns cached template without calling the controller", async () => {
            store.templatesByName.set("foo", template("foo"));
            const t = await store.getByName("foo");
            expect(t.name).toBe("foo");
            expect(ctl.get).not.toHaveBeenCalled();
        });

        it("paginates through Meta API to find an exact name match", async () => {
            ctl.get.and.callFake(async params => {
                if (!params?.after) return makeResponse([template("other")], "cursor-1", 100);
                if (params?.after === "cursor-1")
                    return makeResponse([template("foo"), template("bar")], "cursor-2", 100);
                return makeResponse([], undefined, 100);
            });

            const t = await store.getByName("foo");
            expect(t.name).toBe("foo");
            expect(store.templatesByName.get("foo")?.id).toBe("id-foo");
            expect(ctl.get.calls.count()).toBe(2);
        });

        it("throws when the name is not in any page", async () => {
            ctl.get.and.resolveTo(makeResponse([template("other")], undefined, 1));
            await expectAsync(store.getByName("missing")).toBeRejectedWithError(
                /Template "missing" not found/,
            );
        });

        it("serializes concurrent calls for the SAME name (only one fetch)", async () => {
            const gate = defer<GetTemplateResponse>();
            ctl.get.and.returnValue(gate.promise);

            const a = store.getByName("foo");
            const b = store.getByName("foo");
            await drain();

            // Only one HTTP call started; the second is parked on the per-name mutex.
            expect(ctl.get.calls.count()).toBe(1);

            gate.resolve(makeResponse([template("foo")], undefined, 1));
            const [ra, rb] = await Promise.all([a, b]);
            expect(ra).toBe(rb); // both got the same cached object
            expect(ctl.get.calls.count()).toBe(1);
        });

        it("does not block concurrent calls for DIFFERENT names", async () => {
            const gateA = defer<GetTemplateResponse>();
            const gateB = defer<GetTemplateResponse>();
            ctl.get.and.callFake(async params => {
                if (params?.name === "a") return gateA.promise;
                if (params?.name === "b") return gateB.promise;
                return makeResponse([]);
            });

            const a = store.getByName("a");
            const b = store.getByName("b");
            await drain();

            // Both started simultaneously; they don't queue on each other.
            expect(ctl.get.calls.count()).toBe(2);

            gateA.resolve(makeResponse([template("a")], undefined, 1));
            gateB.resolve(makeResponse([template("b")], undefined, 1));
            await Promise.all([a, b]);
        });
    });

    describe("get() — cursor pagination", () => {
        it("appends the page and advances the cursor", async () => {
            ctl.get.and.callFake(async params => {
                if (!params?.after) return makeResponse([template("t1"), template("t2")], "c1", 5);
                if (params?.after === "c1") return makeResponse([template("t3")], "c2", 5);
                return makeResponse([], undefined, 5);
            });

            await store.get();
            expect(store.templates.map(t => t.name)).toEqual(["t1", "t2"]);

            await store.get();
            expect(store.templates.map(t => t.name)).toEqual(["t1", "t2", "t3"]);
            expect(ctl.get.calls.allArgs().map(a => a[0]?.after)).toEqual([undefined, "c1"]);
        });

        it("returns early when total_count is missing (no append, no cursor advance)", async () => {
            ctl.get.and.resolveTo(makeResponse([template("t1")], "c1", "no-summary"));
            await store.get();
            expect(store.templates).toEqual([]);
            // Re-entering get() must still pass `after: undefined` since cursor wasn't advanced.
            await store.get();
            const afters = ctl.get.calls.allArgs().map(a => a[0]?.after);
            expect(afters.every(a => a === undefined)).toBe(true);
        });

        it("returns early when current length already meets total_count", async () => {
            store.templates = [template("existing-1"), template("existing-2")];
            ctl.get.and.resolveTo(makeResponse([template("t3")], "c1", 2));
            await store.get();
            expect(store.templates.map(t => t.name)).toEqual(["existing-1", "existing-2"]);
        });
    });

    describe("getInitialSearchTemplates", () => {
        beforeEach(() => {
            store.searchValue = "needle";
        });

        it("clears stale searchTemplates and appends the new page", async () => {
            store.searchTemplates = [template("stale")];
            ctl.get.and.resolveTo(makeResponse([template("s1"), template("s2")], "c1", 5));

            await store.getInitialSearchTemplates();
            expect(store.searchTemplates.map(t => t.name)).toEqual(["s1", "s2"]);
        });

        it("returns early if total_count is missing — searchTemplates stays empty after reset", async () => {
            store.searchTemplates = [template("stale")];
            ctl.get.and.resolveTo(makeResponse([template("s1")], "c1", "no-summary"));
            await store.getInitialSearchTemplates();
            expect(store.searchTemplates).toEqual([]);
        });

        it("getSearchTemplates paginates by the search cursor", async () => {
            ctl.get.and.callFake(async params => {
                if (!params?.after) return makeResponse([template("s1")], "sc1", 3);
                return makeResponse([template("s2")], "sc2", 3);
            });

            await store.getInitialSearchTemplates();
            await store.getSearchTemplates();
            expect(store.searchTemplates.map(t => t.name)).toEqual(["s1", "s2"]);
            expect(ctl.get.calls.allArgs().map(a => a[0]?.after)).toEqual([undefined, "sc1"]);
        });
    });

    describe("getInitialSearchTemplatesConcurrent — debounce", () => {
        it("does nothing when there are no active filters", () => {
            // No searchValue, no enum filters set.
            store.getInitialSearchTemplatesConcurrent();
            expect(ctl.get).not.toHaveBeenCalled();
            expect(store.isExecuting).toBe(false);
        });

        it("collapses bursts into one trailing run", async () => {
            store.searchValue = "needle";
            const gate1 = defer<GetTemplateResponse>();
            const gate2 = defer<GetTemplateResponse>();
            let n = 0;
            ctl.get.and.callFake(async () => {
                n++;
                return n === 1 ? gate1.promise : gate2.promise;
            });

            store.getInitialSearchTemplatesConcurrent();
            await drain();
            expect(store.isExecuting).toBe(true);

            store.getInitialSearchTemplatesConcurrent();
            store.getInitialSearchTemplatesConcurrent();
            expect(store.pendingExecution).toBe(true);

            gate1.resolve(makeResponse([], undefined, 0));
            await drain();
            expect(n).toBe(2);
            expect(store.pendingExecution).toBe(false);

            gate2.resolve(makeResponse([], undefined, 0));
            await drain();
            expect(store.isExecuting).toBe(false);
        });
    });

    describe("buildSearchQueryParams (via filter toggling)", () => {
        it("name search mode populates the name param", async () => {
            store.searchValue = "alpha";
            store.searchMode = "name";
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            await store.getInitialSearchTemplates();
            expect(ctl.get.calls.mostRecent().args[0]).toEqual(
                jasmine.objectContaining({ name: "alpha" }),
            );
        });

        it("content search mode populates the content param", async () => {
            store.searchValue = "alpha";
            store.searchMode = "content";
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            await store.getInitialSearchTemplates();
            expect(ctl.get.calls.mostRecent().args[0]).toEqual(
                jasmine.objectContaining({ content: "alpha" }),
            );
        });

        it("language search mode populates the language param", async () => {
            store.searchValue = "en";
            store.searchMode = "language";
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            await store.getInitialSearchTemplates();
            expect(ctl.get.calls.mostRecent().args[0]).toEqual(
                jasmine.objectContaining({ language: "en" }),
            );
        });

        it("includes selected status / category / quality_score (first selection only)", async () => {
            store.selectedStatuses.add(TemplateStatus.approved);
            store.selectedCategories.add(TemplateCategory.marketing);
            store.selectedQualityScores.add(TemplateQualityScore.green);
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            await store.getInitialSearchTemplates();
            expect(ctl.get.calls.mostRecent().args[0]).toEqual(
                jasmine.objectContaining({
                    status: TemplateStatus.approved,
                    category: TemplateCategory.marketing,
                    quality_score: TemplateQualityScore.green,
                }),
            );
        });
    });

    describe("toggle filters — single-select semantics", () => {
        it("toggleStatus replaces the previous selection", () => {
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            store.toggleStatus(TemplateStatus.approved);
            expect(Array.from(store.selectedStatuses)).toEqual([TemplateStatus.approved]);
            store.toggleStatus(TemplateStatus.pending);
            expect(Array.from(store.selectedStatuses)).toEqual([TemplateStatus.pending]);
        });

        it("toggleStatus clears when re-selecting the same value", () => {
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            store.toggleStatus(TemplateStatus.approved);
            store.toggleStatus(TemplateStatus.approved);
            expect(store.selectedStatuses.size).toBe(0);
        });

        it("toggleCategory and toggleQualityScore behave the same way", () => {
            ctl.get.and.resolveTo(makeResponse([], undefined, 0));
            store.toggleCategory(TemplateCategory.marketing);
            store.toggleCategory(TemplateCategory.utility);
            expect(Array.from(store.selectedCategories)).toEqual([TemplateCategory.utility]);

            store.toggleQualityScore(TemplateQualityScore.green);
            store.toggleQualityScore(TemplateQualityScore.green);
            expect(store.selectedQualityScores.size).toBe(0);
        });
    });

    describe("hasActiveFilters / clearAllFilters", () => {
        it("hasActiveFilters reflects searchValue and enum filters", () => {
            expect(store.hasActiveFilters()).toBe(false);
            store.searchValue = "x";
            expect(store.hasActiveFilters()).toBe(true);
            store.searchValue = "";
            store.selectedStatuses.add(TemplateStatus.approved);
            expect(store.hasActiveFilters()).toBe(true);
        });

        it("clearAllFilters wipes search state", () => {
            store.searchValue = "x";
            store.selectedStatuses.add(TemplateStatus.approved);
            store.selectedCategories.add(TemplateCategory.marketing);
            store.selectedQualityScores.add(TemplateQualityScore.green);
            store.searchTemplates = [template("s1")];

            store.clearAllFilters();

            expect(store.hasActiveFilters()).toBe(false);
            expect(store.searchTemplates).toEqual([]);
        });
    });

    describe("workspace change", () => {
        it("clears templates, search state, cursors, and filters", () => {
            store.templates = [template("t1")];
            store.searchTemplates = [template("s1")];
            store.templatesByName.set("t1", template("t1"));
            store.searchValue = "x";
            store.selectedStatuses.add(TemplateStatus.approved);

            workspaceChanged.next({});

            expect(store.templates).toEqual([]);
            expect(store.searchTemplates).toEqual([]);
            expect(store.templatesByName.size).toBe(0);
            expect(store.searchValue).toBe("");
            expect(store.hasActiveFilters()).toBe(false);
        });
    });

    describe("addTemplatesToTemplatesByName concurrency", () => {
        it("populates the Map for every entry (eventual consistency)", async () => {
            await store.addTemplates([template("a"), template("b"), template("c")]);
            // The implementation acquires per-name locks via fire-and-forget forEach;
            // give them time to settle before asserting.
            await drain();
            expect(store.templatesByName.get("a")?.id).toBe("id-a");
            expect(store.templatesByName.get("b")?.id).toBe("id-b");
            expect(store.templatesByName.get("c")?.id).toBe("id-c");
            expect(store.templates.map(t => t.name)).toEqual(["a", "b", "c"]);
        });
    });
});
