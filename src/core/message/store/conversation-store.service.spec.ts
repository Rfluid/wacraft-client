import { TestBed } from "@angular/core/testing";

import { ConversationStoreService } from "./conversation-store.service";

describe("ConversationStoreService", () => {
    let service: ConversationStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ConversationStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
