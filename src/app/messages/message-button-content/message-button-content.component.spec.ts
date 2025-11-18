import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageButtonContentComponent } from "./message-button-content.component";

describe("MessageButtonContentComponent", () => {
    let component: MessageButtonContentComponent;
    let fixture: ComponentFixture<MessageButtonContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageButtonContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageButtonContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
