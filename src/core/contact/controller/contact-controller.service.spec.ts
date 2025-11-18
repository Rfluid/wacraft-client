import { TestBed } from "@angular/core/testing";

import { ContactControllerService } from "./contact-controller.service";

describe("ContactControllerService", () => {
    let service: ContactControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ContactControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
