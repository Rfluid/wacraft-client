import { TestBed } from "@angular/core/testing";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { BillingSubscriptionsComponent } from "./billing-subscriptions.component";
import { BillingSubscriptionStoreService } from "../../../core/billing/store/billing-subscription-store.service";
import { WorkspaceStoreService } from "../../../core/workspace/store/workspace-store.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("BillingSubscriptionsComponent — scroll across user vs workspace scope", () => {
    let component: BillingSubscriptionsComponent;
    let store: jasmine.SpyObj<BillingSubscriptionStoreService> & {
        userSubscriptions: unknown[];
        workspaceSubscriptions: unknown[];
        reachedMaxUserLimit: boolean;
        reachedMaxWorkspaceLimit: boolean;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<BillingSubscriptionStoreService>(
            "BillingSubscriptionStoreService",
            ["getUserSubscriptions", "getWorkspaceSubscriptions", "loadUserSubscriptions"],
        );
        spy.getUserSubscriptions.and.resolveTo(undefined as never);
        spy.getWorkspaceSubscriptions.and.resolveTo(undefined as never);
        spy.loadUserSubscriptions.and.resolveTo(undefined as never);
        store = Object.assign(spy, {
            userSubscriptions: [],
            workspaceSubscriptions: [],
            reachedMaxUserLimit: false,
            reachedMaxWorkspaceLimit: false,
        });

        TestBed.configureTestingModule({
            providers: [
                { provide: BillingSubscriptionStoreService, useValue: store },
                {
                    provide: WorkspaceStoreService,
                    useValue: { hasPolicy: () => true } as never,
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new BillingSubscriptionsComponent(),
        );
    });

    it("calls getUserSubscriptions in user scope near bottom", () => {
        component.subscriptionScope = "user";
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getUserSubscriptions).toHaveBeenCalled();
        expect(store.getWorkspaceSubscriptions).not.toHaveBeenCalled();
    });

    it("calls getWorkspaceSubscriptions in workspace scope near bottom", () => {
        component.subscriptionScope = "workspace";
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getWorkspaceSubscriptions).toHaveBeenCalled();
    });

    it("respects per-scope reachedMax", () => {
        component.subscriptionScope = "user";
        store.reachedMaxUserLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getUserSubscriptions).not.toHaveBeenCalled();

        component.subscriptionScope = "workspace";
        store.reachedMaxWorkspaceLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.getWorkspaceSubscriptions).not.toHaveBeenCalled();
    });

    it("does nothing far from bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(store.getUserSubscriptions).not.toHaveBeenCalled();
    });
});
