import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { BillingSubscriptionControllerService } from "./billing-subscription-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("BillingSubscriptionControllerService", () => {
    let service: BillingSubscriptionControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(BillingSubscriptionControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs subscription with default pagination of 50", async () => {
        await service.get();
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toContain("subscription");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 50, offset: 0 }),
        );
    });

    it("checkout POSTs to subscription/checkout", async () => {
        await service.checkout({ plan_id: "p1" } as never);
        expect(http.post.calls.mostRecent().args[0]).toContain("subscription/checkout");
    });

    it("createManual POSTs to subscription/manual", async () => {
        await service.createManual({ plan_id: "p1" } as never);
        expect(http.post.calls.mostRecent().args[0]).toContain("subscription/manual");
    });

    it("cancel sends DELETE on subscription with id param", async () => {
        await service.cancel("s-1");
        const args = http.delete.calls.mostRecent().args;
        expect(args[0]).toContain("subscription");
        expect((args[1] as { params: { id: string } }).params).toEqual({ id: "s-1" });
    });

    it("reactivate / sync / retry POST with id param to their respective endpoints", async () => {
        await service.reactivate("s-1");
        await service.sync("s-1");
        await service.retry("s-1");
        const calls = http.post.calls.allArgs();
        const urls = calls.map(c => c[0] as string);
        expect(urls.some(u => u.includes("reactivate"))).toBe(true);
        expect(urls.some(u => u.includes("sync"))).toBe(true);
        expect(urls.some(u => u.includes("retry"))).toBe(true);
    });
});
