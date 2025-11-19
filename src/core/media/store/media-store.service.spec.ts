import { TestBed } from "@angular/core/testing";

import { MediaStoreService } from "./media-store.service";

describe("MediaStoreService", () => {
    let service: MediaStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MediaStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
