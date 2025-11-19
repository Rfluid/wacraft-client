import { TestBed } from "@angular/core/testing";

import { WebhookControllerService } from "./webhook-controller.service";

describe("WebhookControllerService", () => {
    let service: WebhookControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WebhookControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
