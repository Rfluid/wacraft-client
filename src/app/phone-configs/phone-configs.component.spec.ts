import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";

import { PhoneConfigsComponent } from "./phone-configs.component";
import { PhoneConfigStoreService } from "../../core/phone-config/store/phone-config-store.service";
import { PhoneConfigControllerService } from "../../core/phone-config/controller/phone-config-controller.service";
import { WorkspaceStoreService } from "../../core/workspace/store/workspace-store.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("PhoneConfigsComponent — scroll & store interaction", () => {
    let component: PhoneConfigsComponent;
    let store: jasmine.SpyObj<PhoneConfigStoreService> & {
        reachedMaxLimit: boolean;
        loading: boolean;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<PhoneConfigStoreService>("PhoneConfigStoreService", [
            "get",
            "load",
        ]);
        spy.get.and.resolveTo(undefined as never);
        spy.load.and.resolveTo(undefined as never);
        store = Object.assign(spy, { reachedMaxLimit: false, loading: false });

        TestBed.configureTestingModule({
            providers: [
                { provide: PhoneConfigStoreService, useValue: store },
                {
                    provide: PhoneConfigControllerService,
                    useValue: {} as never,
                },
                {
                    provide: WorkspaceStoreService,
                    useValue: {} as never,
                },
                {
                    provide: Router,
                    useValue: { navigate: jasmine.createSpy("navigate") },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new PhoneConfigsComponent(),
        );
    });

    it("does nothing when not near the bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls store.get when near bottom and not at max / loading", () => {
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).toHaveBeenCalled();
    });

    it("does not call store.get when reachedMaxLimit", () => {
        store.reachedMaxLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("does not call store.get when loading", () => {
        store.loading = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("scrolling re-entrance guard blocks duplicates", async () => {
        let resolveFirst!: () => void;
        store.get.and.returnValue(
            new Promise<void>(res => {
                resolveFirst = res;
            }),
        );
        component.onScroll(scrollEv(nearBottom()));
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get.calls.count()).toBe(1);
        resolveFirst();
        await Promise.resolve();
    });
});
