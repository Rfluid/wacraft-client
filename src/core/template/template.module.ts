import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateComponentTypeConverterPipe } from "./pipe/template-component-type-converter.pipe";

@NgModule({
    declarations: [],
    providers: [TemplateComponentTypeConverterPipe],
    imports: [CommonModule],
})
export class TemplateModule {}
