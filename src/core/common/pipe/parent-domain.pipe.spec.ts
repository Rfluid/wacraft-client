import { ParentDomainPipe } from "./parent-domain.pipe";

describe("ParentDomainPipe", () => {
    it("create an instance", () => {
        const pipe = new ParentDomainPipe();
        expect(pipe).toBeTruthy();
    });
});
