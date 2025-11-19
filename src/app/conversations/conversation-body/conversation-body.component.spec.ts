import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConversationBodyComponent } from "./conversation-body.component";

describe("ConversationBodyComponent", () => {
    let component: ConversationBodyComponent;
    let fixture: ComponentFixture<ConversationBodyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConversationBodyComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ConversationBodyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
