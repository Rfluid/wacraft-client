import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageInfoDataComponent } from "./message-info-data.component";

describe("MessageInfoDataComponent", () => {
    let component: MessageInfoDataComponent;
    let fixture: ComponentFixture<MessageInfoDataComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageInfoDataComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageInfoDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
