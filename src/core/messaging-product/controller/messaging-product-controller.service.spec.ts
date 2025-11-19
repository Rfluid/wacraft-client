import { TestBed } from "@angular/core/testing";

import { MessagingProductControllerService } from "./messaging-product-controller.service";

describe("MessagingProductControllerService", () => {
    let service: MessagingProductControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MessagingProductControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
