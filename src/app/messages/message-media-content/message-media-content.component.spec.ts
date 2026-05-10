import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { MessageMediaContentComponent } from "./message-media-content.component";

describe("MessageMediaContentComponent", () => {
    let component: MessageMediaContentComponent;
    let fixture: ComponentFixture<MessageMediaContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageMediaContentComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageMediaContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
