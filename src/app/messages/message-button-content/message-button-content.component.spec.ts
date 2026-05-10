import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { MessageButtonContentComponent } from "./message-button-content.component";

describe("MessageButtonContentComponent", () => {
    let component: MessageButtonContentComponent;
    let fixture: ComponentFixture<MessageButtonContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageButtonContentComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageButtonContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
