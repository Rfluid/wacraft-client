import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { UserSidebarComponent } from "./user-sidebar.component";
import { UserStoreService } from "../../../core/user/store/user-store.service";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("UserSidebarComponent — scroll & store interaction", () => {
    let component: UserSidebarComponent;
    let store: jasmine.SpyObj<UserStoreService> & {
        searchValue: string;
        reachedMaxLimit: boolean;
        reachedMaxSearchLimit: boolean;
        isExecuting: boolean;
        pendingExecution: boolean;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<UserStoreService>("UserStoreService", [
            "get",
            "getSearch",
            "getInitialSearch",
        ]);
        spy.get.and.resolveTo(undefined as never);
        spy.getSearch.and.resolveTo(undefined as never);
        spy.getInitialSearch.and.resolveTo(undefined as never);
        store = Object.assign(spy, {
            searchValue: "",
            reachedMaxLimit: false,
            reachedMaxSearchLimit: false,
            isExecuting: false,
            pendingExecution: false,
        });

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: UserStoreService, useValue: store },
                {
                    provide: QueryParamsService,
                    useValue: {
                        globalQueryParams: {},
                        sidebarOpen: true,
                        openSidebar: jasmine.createSpy("openSidebar"),
                        closeSidebar: jasmine.createSpy("closeSidebar"),
                    },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new UserSidebarComponent(),
        );
    });

    it("does nothing when not near the bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls store.get() when near bottom and not searching", () => {
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).toHaveBeenCalled();
    });

    it("respects reachedMaxLimit", () => {
        store.reachedMaxLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls getSearch when searching and not gated", () => {
        store.searchValue = "x";
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getSearch).toHaveBeenCalled();
    });

    it("scrolling re-entrance guard blocks duplicates", async () => {
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
