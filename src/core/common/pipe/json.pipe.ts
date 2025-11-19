import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "json",
    standalone: true,
})
export class JsonPipe implements PipeTransform {
    transform(value: unknown): string {
        try {
            const stringified = JSON.stringify(value, null, 4);
            return typeof stringified === "string" ? stringified : String(value ?? "");
        } catch {
            return String(value ?? "");
        }
    }
}
