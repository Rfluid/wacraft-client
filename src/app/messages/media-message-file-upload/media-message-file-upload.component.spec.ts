import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MediaMessageFileUploadComponent } from "./media-message-file-upload.component";

describe("MediaMessageFileUploadComponent", () => {
    let component: MediaMessageFileUploadComponent;
    let fixture: ComponentFixture<MediaMessageFileUploadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MediaMessageFileUploadComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MediaMessageFileUploadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
