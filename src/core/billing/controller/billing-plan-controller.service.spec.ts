import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { BillingPlanControllerService } from "./billing-plan-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("BillingPlanControllerService", () => {
    let service: BillingPlanControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(BillingPlanControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs plan with default pagination of 50", async () => {
        await service.get();
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toContain("plan");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 50, offset: 0 }),
        );
    });

    it("create POSTs the plan payload", async () => {
        await service.create({ name: "Pro" } as never);
        expect(http.post.calls.mostRecent().args[0]).toContain("plan");
    });

    it("update PUTs the payload with id query", async () => {
        await service.update("p1", { name: "Pro+" } as never);
        const args = http.put.calls.mostRecent().args;
        expect(args[0]).toContain("plan");
        expect((args[2] as { params: { id: string } }).params).toEqual({ id: "p1" });
    });

    it("delete sends DELETE with id param", async () => {
        await service.delete("p1");
        const args = http.delete.calls.mostRecent().args;
        expect((args[1] as { params: { id: string } }).params).toEqual({ id: "p1" });
    });
});
