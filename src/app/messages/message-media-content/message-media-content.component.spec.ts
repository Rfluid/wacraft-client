import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageMediaContentComponent } from "./message-media-content.component";

describe("MessageMediaContentComponent", () => {
    let component: MessageMediaContentComponent;
    let fixture: ComponentFixture<MessageMediaContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageMediaContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageMediaContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
