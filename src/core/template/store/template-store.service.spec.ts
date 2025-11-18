import { TestBed } from "@angular/core/testing";

import { TemplateStoreService } from "./template-store.service";

describe("TemplateStoreService", () => {
    let service: TemplateStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TemplateStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
