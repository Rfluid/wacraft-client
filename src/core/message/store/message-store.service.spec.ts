import { TestBed } from "@angular/core/testing";

import { MessageStoreService } from "./message-store.service";

describe("MessageStoreService", () => {
    let service: MessageStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MessageStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
