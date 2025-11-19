import { TestBed } from "@angular/core/testing";

import { LocalSettingsService } from "./local-settings.service";

describe("LocalSettingsService", () => {
    let service: LocalSettingsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LocalSettingsService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
