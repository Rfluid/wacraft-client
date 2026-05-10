import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { ActivatedRoute } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { Subject } from "rxjs";

import { WebhookLogsComponent } from "./webhook-logs.component";
import { WebhookLogsControllerService } from "../../../core/webhook/controller/webhook-logs-controller.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("WebhookLogsComponent — scroll", () => {
    let component: WebhookLogsComponent;

    beforeEach(() => {
        const ctl = jasmine.createSpyObj<WebhookLogsControllerService>(
            "WebhookLogsControllerService",
            ["get"],
        );
        ctl.get.and.resolveTo([] as never);

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: WebhookLogsControllerService, useValue: ctl },
                {
                    provide: ActivatedRoute,
                    useValue: { queryParams: new Subject() },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new WebhookLogsComponent(),
        );
    });

    it("does nothing far from bottom", async () => {
        spyOn(component, "loadLogs");
        component.onScroll(scrollEv(farFromBottom()));
        await component.getPromise;
        expect(component.loadLogs).not.toHaveBeenCalled();
    });

    it("does not call loadLogs while isLoading is true", async () => {
        component.isLoading = true;
        spyOn(component, "loadLogs");
        component.onScroll(scrollEv(nearBottom()));
        await component.getPromise;
        expect(component.loadLogs).not.toHaveBeenCalled();
    });

    it("calls loadLogs near bottom when not loading", async () => {
        spyOn(component, "loadLogs").and.resolveTo();
        component.onScroll(scrollEv(nearBottom()));
        await component.getPromise;
        await Promise.resolve();
        expect(component.loadLogs).toHaveBeenCalled();
    });
});
