import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { Subject } from "rxjs";

import { ContactsModalComponent } from "./contacts-modal.component";
import { ConversationStoreService } from "../../../core/message/store/conversation-store.service";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("ContactsModalComponent — scroll & store interaction", () => {
    let component: ContactsModalComponent;
    let store: jasmine.SpyObj<ConversationStoreService> & {
        searchValue: string;
        reachedMaxConversationLimit: boolean;
        reachedMaxSearchConversationLimit: boolean;
        isExecuting: boolean;
        pendingExecution: boolean;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<ConversationStoreService>("ConversationStoreService", [
            "initConditionally",
            "get",
            "getSearchConversations",
            "getInitialSearch",
        ]);
        spy.initConditionally.and.resolveTo(undefined as never);
        spy.get.and.resolveTo(undefined as never);
        spy.getSearchConversations.and.resolveTo(undefined as never);
        spy.getInitialSearch.and.resolveTo(undefined as never);
        store = Object.assign(spy, {
            searchValue: "",
            reachedMaxConversationLimit: false,
            reachedMaxSearchConversationLimit: false,
            isExecuting: false,
            pendingExecution: false,
        });

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: ConversationStoreService, useValue: store },
                { provide: QueryParamsService, useValue: { globalQueryParams: {} } },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParams: {} }, queryParams: new Subject() },
                },
                { provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new ContactsModalComponent(),
        );
    });

    it("does nothing when not near the bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls store.get when near bottom and not searching", () => {
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).toHaveBeenCalled();
    });

    it("respects reachedMaxConversationLimit", () => {
        store.reachedMaxConversationLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls getSearchConversations when searchValue is set", () => {
        store.searchValue = "x";
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getSearchConversations).toHaveBeenCalled();
    });

    it("calls getSearchConversations when MPC filter is set", () => {
        component.messagingProductContactIdFilter = "mpc-1";
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getSearchConversations).toHaveBeenCalled();
    });

    it("does not call getSearchConversations when isExecuting / pendingExecution / reachedMax", () => {
        store.searchValue = "x";
        store.isExecuting = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getSearchConversations).not.toHaveBeenCalled();
    });
});
