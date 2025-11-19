import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageReactionContentComponent } from "./message-reaction-content.component";

describe("MessageReactionContentComponent", () => {
    let component: MessageReactionContentComponent;
    let fixture: ComponentFixture<MessageReactionContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageReactionContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageReactionContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
