import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { TemplateSidebarComponent } from "./template-sidebar.component";
import { TemplateStoreService } from "../../../core/template/store/template-store.service";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";

interface ScrollEl {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
}
const scrollEv = (el: ScrollEl) => ({ target: el }) as unknown as Event;
const nearBottom = (): ScrollEl => ({
    scrollHeight: 1000,
    scrollTop: 950,
    clientHeight: 100,
});
const farFromBottom = (): ScrollEl => ({
    scrollHeight: 10_000,
    scrollTop: 0,
    clientHeight: 100,
});

describe("TemplateSidebarComponent — scroll & store interaction", () => {
    let component: TemplateSidebarComponent;
    let store: jasmine.SpyObj<TemplateStoreService> & {
        searchValue: string;
        isExecuting: boolean;
        pendingExecution: boolean;
        hasActiveFilters: jasmine.Spy;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<TemplateStoreService>("TemplateStoreService", [
            "get",
            "getSearchTemplates",
            "getInitialSearchTemplates",
            "addFilter",
            "hasActiveFilters",
        ]);
        spy.get.and.resolveTo(undefined as never);
        spy.getSearchTemplates.and.resolveTo(undefined as never);
        spy.getInitialSearchTemplates.and.resolveTo(undefined as never);
        spy.addFilter.and.resolveTo(undefined as never);
        spy.hasActiveFilters.and.returnValue(false);

        store = Object.assign(spy, {
            searchValue: "",
            isExecuting: false,
            pendingExecution: false,
        });

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: TemplateStoreService, useValue: store },
                {
                    provide: QueryParamsService,
                    useValue: {
                        globalQueryParams: {},
                        sidebarOpen: true,
                        openSidebar: jasmine.createSpy("openSidebar"),
                        closeSidebar: jasmine.createSpy("closeSidebar"),
                    },
                },
                {
                    provide: Router,
                    useValue: { navigate: jasmine.createSpy("navigate") },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new TemplateSidebarComponent(),
        );
    });

    describe("onScroll", () => {
        it("does nothing when not near bottom", () => {
            component.onScroll(scrollEv(farFromBottom()));
            expect(store.get).not.toHaveBeenCalled();
            expect(store.getSearchTemplates).not.toHaveBeenCalled();
        });

        it("calls store.get() when near bottom and not in search mode", () => {
            store.hasActiveFilters.and.returnValue(false);
            component.onScroll(scrollEv(nearBottom()));
            expect(store.get).toHaveBeenCalled();
            expect(store.getSearchTemplates).not.toHaveBeenCalled();
        });

        it("calls getSearchTemplates when in search mode and not executing/pending", () => {
            store.hasActiveFilters.and.returnValue(true);
            component.onScroll(scrollEv(nearBottom()));
            expect(store.getSearchTemplates).toHaveBeenCalled();
            expect(store.get).not.toHaveBeenCalled();
        });

        it("does not fire a fetch in search mode while isExecuting is set", () => {
            store.hasActiveFilters.and.returnValue(true);
            store.isExecuting = true;
            component.onScroll(scrollEv(nearBottom()));
            expect(store.getSearchTemplates).not.toHaveBeenCalled();
        });

        it("does not fire a fetch in search mode while pendingExecution is set", () => {
            store.hasActiveFilters.and.returnValue(true);
            store.pendingExecution = true;
            component.onScroll(scrollEv(nearBottom()));
            expect(store.getSearchTemplates).not.toHaveBeenCalled();
        });
    });

    describe("scrolling re-entrance guard", () => {
        it("blocks a second scroll while one fetch is in flight", async () => {
            let resolveFirst!: () => void;
            store.get.and.returnValue(
                new Promise<void>(res => {
                    resolveFirst = res;
                }),
            );

            component.onScroll(scrollEv(nearBottom()));
            component.onScroll(scrollEv(nearBottom()));
            expect(store.get.calls.count()).toBe(1);

            resolveFirst();
            await Promise.resolve();
        });
    });

    describe("addMessagingProductContactIdField", () => {
        it("delegates to store.addFilter with a labelled text", async () => {
            await component.addMessagingProductContactIdField("mpc-9");
            expect(store.addFilter).toHaveBeenCalledWith(
                jasmine.objectContaining({ text: jasmine.stringMatching(/mpc-9/) }),
            );
        });
    });
});
