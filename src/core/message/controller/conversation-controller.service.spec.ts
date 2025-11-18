import { TestBed } from "@angular/core/testing";

import { ConversationControllerService } from "./conversation-controller.service";

describe("ConversationControllerService", () => {
    let service: ConversationControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ConversationControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
