import { CountdownPipe } from "./countdown.pipe";

describe("CountdownPipe", () => {
    const pipe = new CountdownPipe();

    it("formats sub-minute totals as just seconds", () => {
        expect(pipe.transform(0)).toBe("0s");
        expect(pipe.transform(30)).toBe("30s");
        expect(pipe.transform(59)).toBe("59s");
    });

    it("formats whole minutes without seconds", () => {
        expect(pipe.transform(60)).toBe("1m");
        expect(pipe.transform(300)).toBe("5m");
    });

    it("formats minutes-and-seconds combinations", () => {
        expect(pipe.transform(65)).toBe("1m 5s");
        expect(pipe.transform(125)).toBe("2m 5s");
    });
});
