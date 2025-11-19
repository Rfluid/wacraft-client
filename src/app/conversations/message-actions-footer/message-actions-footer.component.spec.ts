import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageActionsFooterComponent } from "./message-actions-footer.component";

describe("MessageActionsFooterComponent", () => {
    let component: MessageActionsFooterComponent;
    let fixture: ComponentFixture<MessageActionsFooterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageActionsFooterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageActionsFooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
