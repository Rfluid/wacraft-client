import { TestBed } from "@angular/core/testing";

import { TemplateControllerService } from "./template-controller.service";

describe("TemplateControllerService", () => {
    let service: TemplateControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TemplateControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
