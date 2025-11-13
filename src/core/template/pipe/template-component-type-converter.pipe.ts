import { Pipe, PipeTransform } from "@angular/core";
import { TemplateComponentType } from "../model/template-component-type.model";
import { UseTemplateComponentType } from "../../../core/message/model/use-template-component.model";

/**
 * Converts TemplateComponentType (from API) to UseTemplateComponentType (for sending messages)
 * Handles the BUTTONS -> BUTTON conversion required by WhatsApp API
 */
@Pipe({
    name: "templateComponentTypeConverter",
    standalone: true,
})
export class TemplateComponentTypeConverterPipe implements PipeTransform {
    transform(value: TemplateComponentType | string): UseTemplateComponentType {
        const typeStr = String(value).toUpperCase();

        switch (typeStr.toUpperCase()) {
            case "HEADER":
                return UseTemplateComponentType.header;
            case "BODY":
                return UseTemplateComponentType.body;
            case "FOOTER":
                return UseTemplateComponentType.footer;
            case "BUTTONS":
                return UseTemplateComponentType.button; // Convert BUTTONS to BUTTON
            case "BUTTON":
                return UseTemplateComponentType.button;
            default:
                throw new Error(`Unknown template component type: ${typeStr}`);
        }
    }
}
