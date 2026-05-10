import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector, ElementRef } from "@angular/core";

import { WorkspaceSwitcherComponent } from "./workspace-switcher.component";
import { WorkspaceStoreService } from "../../../core/workspace/store/workspace-store.service";
import { WorkspaceControllerService } from "../../../core/workspace/controller/workspace-controller.service";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("WorkspaceSwitcherComponent — scroll", () => {
    let component: WorkspaceSwitcherComponent;
    let store: jasmine.SpyObj<WorkspaceStoreService> & { reachedMaxLimit: boolean };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<WorkspaceStoreService>("WorkspaceStoreService", ["get"]);
        spy.get.and.resolveTo(undefined as never);
        store = Object.assign(spy, { reachedMaxLimit: false });

        TestBed.configureTestingModule({
            providers: [
                { provide: WorkspaceStoreService, useValue: store },
                { provide: WorkspaceControllerService, useValue: {} as never },
                { provide: QueryParamsService, useValue: { globalQueryParams: {} } },
                { provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
                {
                    provide: ElementRef,
                    useValue: { nativeElement: document.createElement("div") },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new WorkspaceSwitcherComponent(),
        );
    });

    it("does nothing when not near the bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(store.get).not.toHaveBeenCalled();
    });

    it("calls store.get() near bottom when not at max", () => {
        component.onScroll(scrollEv(nearBottom()));
        expect(store.get).toHaveBeenCalled();
    });

    it("does nothing when reachedMaxLimit", () => {
        store.reachedMaxLimit = true;
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
