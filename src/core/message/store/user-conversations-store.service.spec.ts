import { TestBed } from "@angular/core/testing";

import { UserConversationsStoreService } from "./user-conversations-store.service";

describe("UserConversationsStoreService", () => {
    let service: UserConversationsStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserConversationsStoreService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
