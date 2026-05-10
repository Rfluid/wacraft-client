import { TestBed } from "@angular/core/testing";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { BillingAdminComponent } from "./billing-admin.component";
import { BillingPlanStoreService } from "../../core/billing/store/billing-plan-store.service";
import { BillingSubscriptionStoreService } from "../../core/billing/store/billing-subscription-store.service";
import { BillingEndpointWeightStoreService } from "../../core/billing/store/billing-endpoint-weight-store.service";
import { BillingPlanControllerService } from "../../core/billing/controller/billing-plan-controller.service";
import { BillingPlanPriceControllerService } from "../../core/billing/controller/billing-plan-price-controller.service";
import { BillingSubscriptionControllerService } from "../../core/billing/controller/billing-subscription-controller.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("BillingAdminComponent — scroll fans out to plan + weight stores", () => {
    let component: BillingAdminComponent;
    let planStore: jasmine.SpyObj<BillingPlanStoreService> & { reachedMaxLimit: boolean };
    let weightStore: jasmine.SpyObj<BillingEndpointWeightStoreService> & {
        reachedMaxLimit: boolean;
    };

    beforeEach(() => {
        const planSpy = jasmine.createSpyObj<BillingPlanStoreService>("BillingPlanStoreService", [
            "get",
            "load",
        ]);
        planSpy.get.and.resolveTo(undefined as never);
        planSpy.load.and.resolveTo(undefined as never);
        planStore = Object.assign(planSpy, { reachedMaxLimit: false });

        const weightSpy = jasmine.createSpyObj<BillingEndpointWeightStoreService>(
            "BillingEndpointWeightStoreService",
            ["get", "load"],
        );
        weightSpy.get.and.resolveTo(undefined as never);
        weightSpy.load.and.resolveTo(undefined as never);
        weightStore = Object.assign(weightSpy, { reachedMaxLimit: false });

        TestBed.configureTestingModule({
            providers: [
                { provide: BillingPlanStoreService, useValue: planStore },
                { provide: BillingSubscriptionStoreService, useValue: {} as never },
                { provide: BillingEndpointWeightStoreService, useValue: weightStore },
                { provide: BillingPlanControllerService, useValue: {} as never },
                { provide: BillingPlanPriceControllerService, useValue: {} as never },
                { provide: BillingSubscriptionControllerService, useValue: {} as never },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new BillingAdminComponent(),
        );
    });

    it("does nothing far from bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(planStore.get).not.toHaveBeenCalled();
        expect(weightStore.get).not.toHaveBeenCalled();
    });

    it("calls both stores' get() near bottom when neither has reachedMax", async () => {
        component.onScroll(scrollEv(nearBottom()));
        await Promise.resolve();
        expect(planStore.get).toHaveBeenCalled();
        expect(weightStore.get).toHaveBeenCalled();
    });

    it("skips a store whose reachedMaxLimit is true", async () => {
        planStore.reachedMaxLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        await Promise.resolve();
        expect(planStore.get).not.toHaveBeenCalled();
        expect(weightStore.get).toHaveBeenCalled();
    });

    it("scrolling re-entrance guard blocks duplicate scroll events", async () => {
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
