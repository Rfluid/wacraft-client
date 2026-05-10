import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { BillingUsageControllerService } from "./billing-usage-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("BillingUsageControllerService", () => {
    let service: BillingUsageControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(BillingUsageControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs usage", async () => {
        await service.get();
        expect(http.get).toHaveBeenCalled();
        expect(http.get.calls.mostRecent().args[0]).toContain("usage");
    });
});
