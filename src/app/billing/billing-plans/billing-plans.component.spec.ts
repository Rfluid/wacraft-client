import { TestBed } from "@angular/core/testing";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { BillingPlansComponent } from "./billing-plans.component";
import { BillingPlanStoreService } from "../../../core/billing/store/billing-plan-store.service";
import { BillingSubscriptionStoreService } from "../../../core/billing/store/billing-subscription-store.service";
import { BillingUsageStoreService } from "../../../core/billing/store/billing-usage-store.service";
import { WorkspaceStoreService } from "../../../core/workspace/store/workspace-store.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("BillingPlansComponent — scroll", () => {
    let component: BillingPlansComponent;
    let planStore: jasmine.SpyObj<BillingPlanStoreService> & { reachedMaxLimit: boolean };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<BillingPlanStoreService>("BillingPlanStoreService", [
            "get",
        ]);
        spy.get.and.resolveTo(undefined as never);
        planStore = Object.assign(spy, { reachedMaxLimit: false, plans: [] as never });

        TestBed.configureTestingModule({
            providers: [
                { provide: BillingPlanStoreService, useValue: planStore },
                {
                    provide: BillingSubscriptionStoreService,
                    useValue: { subscriptions: [] } as never,
                },
                {
                    provide: BillingUsageStoreService,
                    useValue: { usageItems: [], load: () => Promise.resolve() } as never,
                },
                { provide: WorkspaceStoreService, useValue: {} as never },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new BillingPlansComponent(),
        );
    });

    it("does nothing far from bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(planStore.get).not.toHaveBeenCalled();
    });

    it("calls planStore.get near bottom when not at max", () => {
        component.onScroll(scrollEv(nearBottom()));
        expect(planStore.get).toHaveBeenCalled();
    });

    it("does not call planStore.get when reachedMaxLimit", () => {
        planStore.reachedMaxLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(planStore.get).not.toHaveBeenCalled();
    });

    it("re-entrance guard blocks duplicates", async () => {
        let resolveFirst!: () => void;
        planStore.get.and.returnValue(
            new Promise<void>(res => {
                resolveFirst = res;
            }),
        );
        component.onScroll(scrollEv(nearBottom()));
        component.onScroll(scrollEv(nearBottom()));
        expect(planStore.get.calls.count()).toBe(1);
        resolveFirst();
        await Promise.resolve();
    });
});
