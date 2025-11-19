import { NgModule } from "@angular/core";
import { CommonModule as AngularCommon } from "@angular/common";
import { UrlWithHttpPipe } from "./pipe/url-with-http.pipe";
import { JsonPipe } from "./pipe/json.pipe";
import { CapitalizeFirstLetterPipe } from "./pipe/capitalize-first-letter.pipe";
import { EmojiToUnicodeEscapePipe } from "./pipe/emoji-to-unicode-escape.pipe";

@NgModule({
    declarations: [],
    imports: [AngularCommon],
    providers: [UrlWithHttpPipe, JsonPipe, CapitalizeFirstLetterPipe, EmojiToUnicodeEscapePipe],
})
export class CommonModule {}
