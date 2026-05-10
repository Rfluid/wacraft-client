import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { TemplateControllerService } from "./template-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("TemplateControllerService", () => {
    let service: TemplateControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        http.get.and.resolveTo({
            data: { data: [], paging: { cursors: {} } },
        });
        service = TestBed.inject(TemplateControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs root with the query params spread", async () => {
        await service.get({ name: "x", limit: 5 } as never);
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ name: "x", limit: 5 }),
        );
    });

    it("get with no args still passes an (empty) params object", async () => {
        await service.get();
        const params = (http.get.calls.mostRecent().args[1] as { params: object }).params;
        expect(params).toBeDefined();
    });
});
