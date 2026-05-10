import { TestBed } from "@angular/core/testing";
import axios, { AxiosInstance } from "axios";

import { AuthControllerService } from "./auth-controller.service";

describe("AuthControllerService", () => {
    let service: AuthControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        localStorage.clear();
        http = jasmine.createSpyObj<AxiosInstance>("AxiosInstance", ["get", "post"]);
        spyOn(axios, "create").and.returnValue(http);

        TestBed.configureTestingModule({ providers: [AuthControllerService] });
        service = TestBed.inject(AuthControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("register POSTs the user payload to /auth/register", async () => {
        http.post.and.resolveTo({ data: { message: "ok" } });
        const out = await service.register({
            name: "Alice",
            email: "alice@x",
            password: "p",
        });
        expect(http.post).toHaveBeenCalledWith("register", {
            name: "Alice",
            email: "alice@x",
            password: "p",
        });
        expect(out).toEqual({ message: "ok" });
    });

    it("verifyEmail GETs /verify-email with token query param", async () => {
        http.get.and.resolveTo({ data: { message: "verified" } });
        await service.verifyEmail("tok-123");
        expect(http.get).toHaveBeenCalledWith("verify-email", { params: { token: "tok-123" } });
    });

    it("forgotPassword POSTs the email to /forgot-password", async () => {
        http.post.and.resolveTo({ data: { message: "sent" } });
        await service.forgotPassword("alice@x");
        expect(http.post).toHaveBeenCalledWith("forgot-password", { email: "alice@x" });
    });

    it("resetPassword POSTs token + password", async () => {
        http.post.and.resolveTo({ data: { message: "ok" } });
        await service.resetPassword("tok", "newpw");
        expect(http.post).toHaveBeenCalledWith("reset-password", {
            token: "tok",
            password: "newpw",
        });
    });

    it("claimInvitation POSTs the token and forwards the bearer header from localStorage", async () => {
        localStorage.setItem("accessToken", "stored-tok");
        http.post.and.resolveTo({
            data: { message: "ok", workspace_id: "ws-1" },
        });
        await service.claimInvitation("inv-tok");
        expect(http.post).toHaveBeenCalledWith(
            "invitation/claim",
            { token: "inv-tok" },
            { headers: { Authorization: "Bearer stored-tok" } },
        );
    });

    it("claimInvitation falls back to empty bearer when no token is stored", async () => {
        http.post.and.resolveTo({
            data: { message: "ok", workspace_id: "ws-1" },
        });
        await service.claimInvitation("inv-tok");
        const opts = http.post.calls.mostRecent().args[2] as { headers: { Authorization: string } };
        expect(opts.headers.Authorization).toBe("Bearer ");
    });

    it("resendVerification POSTs the email to /resend-verification", async () => {
        http.post.and.resolveTo({ data: { message: "sent" } });
        await service.resendVerification("alice@x");
        expect(http.post).toHaveBeenCalledWith("resend-verification", { email: "alice@x" });
    });
});
