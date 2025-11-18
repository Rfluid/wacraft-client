import { TestBed } from "@angular/core/testing";

import { TemplateInterpolatorService } from "./template-interpolator.service";

describe("TemplateInterpolatorService", () => {
    let service: TemplateInterpolatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TemplateInterpolatorService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
