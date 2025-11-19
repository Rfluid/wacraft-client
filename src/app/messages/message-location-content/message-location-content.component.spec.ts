import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageLocationContentComponent } from "./message-location-content.component";

describe("MessageLocationContentComponent", () => {
    let component: MessageLocationContentComponent;
    let fixture: ComponentFixture<MessageLocationContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageLocationContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageLocationContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
