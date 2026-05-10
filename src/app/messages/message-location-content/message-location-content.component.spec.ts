import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

import { MessageLocationContentComponent } from "./message-location-content.component";

describe("MessageLocationContentComponent", () => {
    let component: MessageLocationContentComponent;
    let fixture: ComponentFixture<MessageLocationContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageLocationContentComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageLocationContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
