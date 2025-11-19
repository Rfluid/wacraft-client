import { TestBed } from "@angular/core/testing";

import { MessageControllerService } from "./message-controller.service";

describe("MessageControllerService", () => {
    let service: MessageControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MessageControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
