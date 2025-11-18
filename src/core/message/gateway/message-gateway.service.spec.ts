import { TestBed } from "@angular/core/testing";

import { MessageGatewayService } from "./message-gateway.service";

describe("MessageGatewayService", () => {
    let service: MessageGatewayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MessageGatewayService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
