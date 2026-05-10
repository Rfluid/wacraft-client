import { TestBed } from "@angular/core/testing";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { LoggerTestingModule } from "ngx-logger/testing";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";

import { ChatsSidebarComponent } from "./chats-sidebar.component";
import { ConversationStoreService } from "../../core/message/store/conversation-store.service";
import { QueryParamsService } from "../../core/navigation/service/query-params.service";

// We test the scroll/branching logic directly without relying on the template
// or ViewChild references. The component class is instantiated inside an
// injection context so the inject() calls in its field initializers resolve.

interface ScrollFakeEl {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
}
function scrollEvent(el: ScrollFakeEl): Event {
    return { target: el } as unknown as Event;
}
function nearBottom(): ScrollFakeEl {
    // scrollHeight - scrollTop <= clientHeight + 100 → near-bottom branch fires.
    return { scrollHeight: 1000, scrollTop: 950, clientHeight: 100 };
}
function farFromBottom(): ScrollFakeEl {
    return { scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 };
}

describe("ChatsSidebarComponent — scroll & store interaction", () => {
    let component: ChatsSidebarComponent;
    let store: jasmine.SpyObj<ConversationStoreService> & {
        searchValue: string;
        reachedMaxConversationLimit: boolean;
        reachedMaxSearchConversationLimit: boolean;
        isExecuting: boolean;
        pendingExecution: boolean;
    };

    beforeEach(() => {
        const storeSpy = jasmine.createSpyObj<ConversationStoreService>(
            "ConversationStoreService",
            [
                "initConditionally",
                "get",
                "getSearchConversations",
                "getInitialSearch",
                "addFilter",
                "read",
            ],
        );
        storeSpy.initConditionally.and.resolveTo(undefined as never);
        storeSpy.get.and.resolveTo(undefined as never);
        storeSpy.getSearchConversations.and.resolveTo(undefined as never);
        storeSpy.getInitialSearch.and.resolveTo(undefined as never);
        storeSpy.addFilter.and.resolveTo(undefined as never);

        // Add the mutable fields the scroll branches read.
        const fullStore = Object.assign(storeSpy, {
            searchValue: "",
            reachedMaxConversationLimit: false,
            reachedMaxSearchConversationLimit: false,
            isExecuting: false,
            pendingExecution: false,
        });
        store = fullStore;

        const queryParamsStub = {
            globalQueryParams: {},
            sidebarOpen: true,
            openSidebar: jasmine.createSpy("openSidebar"),
            closeSidebar: jasmine.createSpy("closeSidebar"),
        };

        const route = {
            snapshot: { queryParams: {} },
            queryParams: new Subject(),
        };

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: ConversationStoreService, useValue: store },
                { provide: QueryParamsService, useValue: queryParamsStub },
                { provide: ActivatedRoute, useValue: route },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new ChatsSidebarComponent(),
        );
    });

    describe("onScroll — branch selection", () => {
        it("does nothing when not near the bottom", () => {
            component.onScroll(scrollEvent(farFromBottom()));
            expect(store.get).not.toHaveBeenCalled();
            expect(store.getSearchConversations).not.toHaveBeenCalled();
        });

        it("calls store.get() when near bottom and not searching", () => {
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.get).toHaveBeenCalled();
            expect(store.getSearchConversations).not.toHaveBeenCalled();
        });

        it("does not call store.get() when reachedMaxConversationLimit is true", () => {
            store.reachedMaxConversationLimit = true;
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.get).not.toHaveBeenCalled();
        });

        it("calls getSearchConversations when searchValue is set", () => {
            store.searchValue = "needle";
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.getSearchConversations).toHaveBeenCalled();
            expect(store.get).not.toHaveBeenCalled();
        });

        it("calls getSearchConversations when an MPC filter is set (no searchValue)", () => {
            component.messagingProductContactIdFilter = "mpc-1";
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.getSearchConversations).toHaveBeenCalled();
        });

        it("does not call getSearchConversations when reachedMaxSearchConversationLimit", () => {
            store.searchValue = "needle";
            store.reachedMaxSearchConversationLimit = true;
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.getSearchConversations).not.toHaveBeenCalled();
        });

        it("does not fire a search fetch while one is already isExecuting", () => {
            store.searchValue = "needle";
            store.isExecuting = true;
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.getSearchConversations).not.toHaveBeenCalled();
        });

        it("does not fire a search fetch while one is queued via pendingExecution", () => {
            store.searchValue = "needle";
            store.pendingExecution = true;
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.getSearchConversations).not.toHaveBeenCalled();
        });
    });

    describe("scrolling re-entrance guard", () => {
        it("a scroll event fired during an in-flight getConversations is ignored", async () => {
            // Hold the first call so `scrolling` stays true between events.
            let resolveFirst!: () => void;
            store.get.and.returnValue(
                new Promise<void>(res => {
                    resolveFirst = res;
                }),
            );

            component.onScroll(scrollEvent(nearBottom()));
            // While the first call is in flight, fire another scroll.
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.get.calls.count()).toBe(1);

            resolveFirst();
            await Promise.resolve();
        });

        it("scrolling flag is restored after a successful fetch", async () => {
            await component.getConversations();
            // Now another scroll should fire.
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.get.calls.count()).toBe(2);
        });

        it("scrolling flag is restored on fetch error (so subsequent scrolls work)", async () => {
            store.get.and.rejectWith(new Error("net"));
            // The component swallows errors via handleErr but errorModal isn't
            // wired in this test; ignore the failure path on errorModal access.
            spyOn(component, "handleErr").and.stub();

            await component.getConversations();
            component.onScroll(scrollEvent(nearBottom()));
            expect(store.get.calls.count()).toBe(2);
        });
    });

    describe("addMessagingProductContactIdField", () => {
        it("forwards a labelled filter and the MPC id to the store", async () => {
            await component.addMessagingProductContactIdField("mpc-9");
            expect(store.addFilter).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    text: jasmine.stringMatching(/mpc-9/),
                }),
                "mpc-9",
            );
        });
    });

    describe("clearSearch", () => {
        it("clears the store's searchValue", () => {
            store.searchValue = "needle";
            // Avoid touching the textarea ViewChild — stub it.
            (
                component as unknown as { searchTextarea: { nativeElement: HTMLElement } }
            ).searchTextarea = {
                nativeElement: {
                    style: { height: "" },
                    focus: jasmine.createSpy("focus"),
                } as unknown as HTMLElement,
            };
            component.clearSearch();
            expect(store.searchValue).toBe("");
        });
    });
});
