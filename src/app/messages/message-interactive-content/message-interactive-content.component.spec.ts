import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageInteractiveContentComponent } from "./message-interactive-content.component";

describe("MessageInteractiveContentComponent", () => {
    let component: MessageInteractiveContentComponent;
    let fixture: ComponentFixture<MessageInteractiveContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageInteractiveContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageInteractiveContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
