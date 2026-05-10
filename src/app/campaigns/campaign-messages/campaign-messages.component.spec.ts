import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { ActivatedRoute } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { Subject } from "rxjs";

import { CampaignMessagesComponent } from "./campaign-messages.component";
import { CampaignMessageControllerService } from "../../../core/campaign/controller/campaign-message-controller.service";
import { CampaignMessageSendErrorControllerService } from "../../../core/campaign/controller/campaign-message-send-error-controller.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("CampaignMessagesComponent — scroll", () => {
    let component: CampaignMessagesComponent;

    beforeEach(() => {
        const ctl = jasmine.createSpyObj<CampaignMessageControllerService>(
            "CampaignMessageControllerService",
            ["get"],
        );
        ctl.get.and.resolveTo([] as never);

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: CampaignMessageControllerService, useValue: ctl },
                {
                    provide: CampaignMessageSendErrorControllerService,
                    useValue: {} as never,
                },
                {
                    provide: ActivatedRoute,
                    useValue: { queryParams: new Subject() },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new CampaignMessagesComponent(),
        );
    });

    it("does nothing far from bottom", async () => {
        spyOn(component, "loadMessages");
        component.onScroll(scrollEv(farFromBottom()));
        await component.getPromise;
        expect(component.loadMessages).not.toHaveBeenCalled();
    });

    it("does not call loadMessages while isLoading is true", async () => {
        component.isLoading = true;
        spyOn(component, "loadMessages");
        component.onScroll(scrollEv(nearBottom()));
        await component.getPromise;
        expect(component.loadMessages).not.toHaveBeenCalled();
    });

    it("calls loadMessages near bottom when not loading", async () => {
        spyOn(component, "loadMessages").and.resolveTo();
        component.onScroll(scrollEv(nearBottom()));
        await component.getPromise;
        await Promise.resolve();
        expect(component.loadMessages).toHaveBeenCalled();
    });
});
