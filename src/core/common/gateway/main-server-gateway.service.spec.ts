import { TestBed } from "@angular/core/testing";

import { MainServerGatewayService } from "./main-server-gateway.service";

describe("MainServerGatewayService", () => {
    let service: MainServerGatewayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MainServerGatewayService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
