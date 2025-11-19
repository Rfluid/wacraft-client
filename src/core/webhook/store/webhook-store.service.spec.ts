import { TestBed } from "@angular/core/testing";

import { WebhookStoreService } from "./webhook-store.service";

describe("WebhookStoreService", () => {
    let service: WebhookStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WebhookStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
