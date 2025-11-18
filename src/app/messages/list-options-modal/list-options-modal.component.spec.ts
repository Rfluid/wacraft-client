import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ListOptionsModalComponent } from "./list-options-modal.component";

describe("ListOptionsModalComponent", () => {
    let component: ListOptionsModalComponent;
    let fixture: ComponentFixture<ListOptionsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListOptionsModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ListOptionsModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
