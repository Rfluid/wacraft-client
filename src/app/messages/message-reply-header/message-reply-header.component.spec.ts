import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageReplyHeaderComponent } from "./message-reply-header.component";

describe("MessageReplyHeaderComponent", () => {
    let component: MessageReplyHeaderComponent;
    let fixture: ComponentFixture<MessageReplyHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageReplyHeaderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageReplyHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
