import { TestBed } from "@angular/core/testing";

import { WebhookLogsControllerService } from "./webhook-logs-controller.service";

describe("WebhookLogsControllerService", () => {
    let service: WebhookLogsControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WebhookLogsControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
