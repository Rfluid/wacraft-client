import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "emojiToUnicodeEscape",
    standalone: true,
})
export class EmojiToUnicodeEscapePipe implements PipeTransform {
    transform(emoji: string): string {
        return Array.from(emoji)
            .map(char => {
                const code = char.charCodeAt(0).toString(16).toUpperCase();
                return "\\u" + code.padStart(4, "0");
            })
            .join("");
    }
}
