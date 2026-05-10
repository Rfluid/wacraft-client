import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { BillingPlanPriceControllerService } from "./billing-plan-price-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("BillingPlanPriceControllerService", () => {
    let service: BillingPlanPriceControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(BillingPlanPriceControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs plan/{id}/price with default pagination of 50", async () => {
        await service.get("plan-1");
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toContain("plan/plan-1/price");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 50, offset: 0 }),
        );
    });

    it("create POSTs to plan/{id}/price", async () => {
        await service.create("plan-1", { amount: 100 } as never);
        expect(http.post.calls.mostRecent().args[0]).toContain("plan/plan-1/price");
    });

    it("update PUTs with id query", async () => {
        await service.update("plan-1", "price-9", { amount: 200 } as never);
        const args = http.put.calls.mostRecent().args;
        expect(args[0]).toContain("plan/plan-1/price");
        expect((args[2] as { params: { id: string } }).params).toEqual({ id: "price-9" });
    });

    it("delete sends DELETE with id query", async () => {
        await service.delete("plan-1", "price-9");
        const args = http.delete.calls.mostRecent().args;
        expect(args[0]).toContain("plan/plan-1/price");
        expect((args[1] as { params: { id: string } }).params).toEqual({ id: "price-9" });
    });
});
