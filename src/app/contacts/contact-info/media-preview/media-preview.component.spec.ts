import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../../core/message/pipe/message-data.pipe";

import { MediaPreviewComponent } from "./media-preview.component";

describe("MediaPreviewComponent", () => {
    let component: MediaPreviewComponent;
    let fixture: ComponentFixture<MediaPreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MediaPreviewComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MediaPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
