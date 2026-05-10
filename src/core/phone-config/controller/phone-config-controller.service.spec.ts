import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { PhoneConfigControllerService } from "./phone-config-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("PhoneConfigControllerService", () => {
    let service: PhoneConfigControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(PhoneConfigControllerService);
    });

    afterEach(() => localStorage.clear());

    const ws = "ws-1";
    const id = "pc-9";

    it("get scopes the path under the workspace id", async () => {
        await service.get(ws);
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toContain(`${ws}/phone-config`);
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 10, offset: 0 }),
        );
    });

    it("create POSTs under workspace/phone-config", async () => {
        await service.create(ws, { phone_number: "1" } as never);
        expect(http.post.calls.mostRecent().args[0]).toContain(`${ws}/phone-config`);
    });

    it("update PATCHes the id-scoped path", async () => {
        await service.update(ws, id, {} as never);
        expect(http.patch.calls.mostRecent().args[0]).toContain(`${ws}/phone-config/${id}`);
    });

    it("delete sends DELETE to id-scoped path", async () => {
        await service.delete(ws, id);
        expect(http.delete.calls.mostRecent().args[0]).toContain(`${ws}/phone-config/${id}`);
    });

    it("getById GETs the id-scoped path", async () => {
        await service.getById(ws, id);
        expect(http.get.calls.mostRecent().args[0]).toContain(`${ws}/phone-config/${id}`);
    });

    it("requestCode / verifyCode / pinAuthenticate / register / deregister POST under sub-paths", async () => {
        await service.requestCode(ws, id, { code_method: "SMS", language: "en" });
        await service.verifyCode(ws, id, { code: "123" });
        await service.pinAuthenticate(ws, id, { pin: "1234" });
        await service.register(ws, id, { pin: "1234" });
        await service.deregister(ws, id);
        const urls = http.post.calls.allArgs().map(a => a[0] as string);
        expect(urls.some(u => u.includes("request-code"))).toBe(true);
        expect(urls.some(u => u.includes("verify-code"))).toBe(true);
        expect(urls.some(u => u.includes("pin-authenticate"))).toBe(true);
        expect(urls.some(u => u.includes("register"))).toBe(true);
        expect(urls.some(u => u.includes("deregister"))).toBe(true);
    });
});
