import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { BillingEndpointWeightControllerService } from "./billing-endpoint-weight-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("BillingEndpointWeightControllerService", () => {
    let service: BillingEndpointWeightControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(BillingEndpointWeightControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs the endpoint-weight path with default pagination of 50", async () => {
        await service.get();
        expect(http.get).toHaveBeenCalled();
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toContain("endpoint-weight");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 50, offset: 0 }),
        );
    });

    it("create POSTs the payload to the endpoint-weight path", async () => {
        const payload = { endpoint: "/x", weight: 1 };
        await service.create(payload as never);
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toContain("endpoint-weight");
        expect(args[1]).toBe(payload);
    });

    it("delete sends DELETE with id query param", async () => {
        await service.delete("ew-1");
        const args = http.delete.calls.mostRecent().args;
        expect(args[0]).toContain("endpoint-weight");
        expect((args[1] as { params: { id: string } }).params).toEqual({ id: "ew-1" });
    });
});
