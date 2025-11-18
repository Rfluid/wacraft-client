import { TestBed } from "@angular/core/testing";

import { MessagingProductContactControllerService } from "./messaging-product-contact-controller.service";

describe("MessagingProductContactControllerService", () => {
    let service: MessagingProductContactControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MessagingProductContactControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
