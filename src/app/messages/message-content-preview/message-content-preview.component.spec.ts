import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageContentPreviewComponent } from "./message-content-preview.component";

describe("MessageContentPreviewComponent", () => {
    let component: MessageContentPreviewComponent;
    let fixture: ComponentFixture<MessageContentPreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageContentPreviewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageContentPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
