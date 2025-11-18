import { TestBed } from "@angular/core/testing";

import { StatusGatewayService } from "./status-gateway.service";

describe("StatusGatewayService", () => {
    let service: StatusGatewayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(StatusGatewayService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
