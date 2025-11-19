import { TestBed } from "@angular/core/testing";

import { PluginsManagerService } from "./plugins-manager.service";

describe("PluginsManagerService", () => {
    let service: PluginsManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PluginsManagerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
