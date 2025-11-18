import { Injectable } from "@angular/core";
import { Template } from "../../template/model/template.model";
import { Conversation } from "../../message/model/conversation.model";
import { MessageType } from "../../message/model/message-type.model";
import { UseTemplate } from "../../message/model/use-template.model";
import { ComponentParameters } from "../../message/model/use-template-component.model";
import { UseMedia } from "../../message/model/media-data.model";
import { TemplateButton, TemplateComponent } from "../model/template-component.model";
import { TemplateComponentType } from "../model/template-component-type.model";
import { TemplateComponentFormat } from "../model/template-component-format.model";

@Injectable({
    providedIn: "root",
})
export class TemplateInterpolatorService {
    constructor() {}

    interpolateTemplate(
        template: Template,
        message: Conversation,
        getTemplateData: () => UseTemplate,
    ): {
        headerText: string;
        headerType: MessageType;
        headerUseMedia: UseMedia;
        bodyText: string;
        footerText: string;
        buttons: TemplateButton[];
    } {
        let headerText = "";
        let headerType: MessageType = MessageType.text;
        let headerUseMedia: UseMedia = {};
        let bodyText = "";
        let footerText = "";
        let buttons: TemplateButton[] = [];

        template.components.forEach(component => {
            switch (component.type.toLowerCase()) {
                case TemplateComponentType.header.toLowerCase():
                    const header = this.loadHeader(component, getTemplateData);
                    headerText = header.headerText;
                    headerType = header.headerType;
                    headerUseMedia = header.headerUseMedia;
                    break;
                case TemplateComponentType.body.toLowerCase():
                    bodyText = this.loadBody(component, getTemplateData);
                    break;
                case TemplateComponentType.footer.toLowerCase():
                    footerText = this.loadFooter(component);
                    break;
                case TemplateComponentType.buttons.toLowerCase():
                    buttons = this.loadButtons(component, getTemplateData);
                    break;
            }
        });

        return {
            headerText,
            headerType,
            headerUseMedia,
            bodyText,
            footerText,
            buttons,
        };
    }

    private loadHeader(component: TemplateComponent, getTemplateData: () => UseTemplate) {
        const example = component.example;
        let headerType: MessageType = component?.format
            ? (component?.format.toLowerCase() as MessageType)
            : MessageType.text;
        let headerText = "";
        let headerUseMedia: UseMedia = {};

        if (
            example?.header_handle &&
            component.format?.toLowerCase() !== TemplateComponentFormat.Text.toLowerCase()
        ) {
            example.header_handle.forEach((_, i) => {
                if (!component.format) return;
                const componentParams = this.findComponentParameter(
                    TemplateComponentType.header,
                    i,
                    getTemplateData,
                );

                const key = component.format.toLowerCase() as keyof UseMedia;

                // Type Assertion: Inform TypeScript that componentParams has the key from UseMedia
                const media = (componentParams as any)[key] as UseMedia[keyof UseMedia];

                if (media) {
                    headerUseMedia = {
                        ...headerUseMedia,
                        [key]: media,
                    };
                }
            });
            return { headerText, headerType, headerUseMedia };
        }

        if (
            component.format?.toLowerCase() === TemplateComponentFormat.Text.toLowerCase() &&
            component.text
        ) {
            headerText = component.text;

            // Extract all variables from the header text
            const variables = this.extractVariables(headerText);

            if (example?.header_text && example.header_text.length > 0) {
                // If example data exists, use the traditional numeric replacement
                example.header_text.forEach((_, i) => {
                    const replaceAtIndex = this.findComponentParameter(
                        TemplateComponentType.header,
                        i,
                        getTemplateData,
                    ).text;
                    if (replaceAtIndex) {
                        headerText = headerText.replace(
                            new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"),
                            replaceAtIndex,
                        );
                    }
                });
            } else if (variables.length > 0) {
                // If no example data, replace variables by their actual names
                variables.forEach((variable, i) => {
                    const replaceAtIndex = this.findComponentParameter(
                        TemplateComponentType.header,
                        i,
                        getTemplateData,
                    ).text;
                    if (replaceAtIndex) {
                        // Escape special regex characters in the variable name
                        const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        headerText = headerText.replace(
                            new RegExp(`\\{\\{${escapedVariable}\\}\\}`, "g"),
                            replaceAtIndex,
                        );
                    }
                });
            }
        }

        return { headerText, headerType, headerUseMedia };
    }

    private loadBody(component: TemplateComponent, getTemplateData: () => UseTemplate): string {
        if (!component.text) return "";
        const example = component.example;
        let bodyText = component.text;

        // Extract all variables from the text
        const variables = this.extractVariables(bodyText);

        if (example?.body_text) {
            // If example data exists, use the traditional numeric replacement
            example.body_text.forEach((_, i) => {
                const replaceAtIndex = this.findComponentParameter(
                    TemplateComponentType.body,
                    i,
                    getTemplateData,
                ).text;
                if (replaceAtIndex) {
                    bodyText = bodyText.replace(
                        new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"),
                        replaceAtIndex,
                    );
                }
            });
        } else if (variables.length > 0) {
            // If no example data, replace variables by their actual names
            variables.forEach((variable, i) => {
                const replaceAtIndex = this.findComponentParameter(
                    TemplateComponentType.body,
                    i,
                    getTemplateData,
                ).text;
                if (replaceAtIndex) {
                    // Escape special regex characters in the variable name
                    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    bodyText = bodyText.replace(
                        new RegExp(`\\{\\{${escapedVariable}\\}\\}`, "g"),
                        replaceAtIndex,
                    );
                }
            });
        }

        return bodyText;
    }

    private loadFooter(component: TemplateComponent): string {
        return component.text || "";
    }

    private loadButtons(
        component: TemplateComponent,
        getTemplateData?: () => UseTemplate,
    ): TemplateButton[] {
        if (!component.buttons) return [];

        // If no template data getter, return buttons as-is
        if (!getTemplateData) return component.buttons;

        // Clone buttons to avoid modifying the original
        const buttons = JSON.parse(JSON.stringify(component.buttons)) as TemplateButton[];

        // Get all BUTTON components from the message data
        // Note: Message data uses "BUTTON" (singular) while template uses "BUTTONS" (plural)
        const templateData = getTemplateData();
        const buttonComponents = templateData.components.filter((comp: any) => {
            const type = comp.type?.toLowerCase();
            return type === "button" || type === "buttons";
        });

        // Process each button and find its corresponding parameters
        buttons.forEach((button, buttonIndex) => {
            try {
                // Find the BUTTON component that matches this button's index
                const buttonComponent = buttonComponents.find((comp: any) => {
                    const compIndex = comp.index !== undefined ? comp.index : comp.sub_type;
                    return compIndex === buttonIndex.toString() || compIndex === buttonIndex;
                });

                if (
                    !buttonComponent ||
                    !buttonComponent.parameters ||
                    buttonComponent.parameters.length === 0
                ) {
                    console.log(
                        `[Button Replacement] No button component or parameters found for index ${buttonIndex}`,
                    );
                    return;
                }

                // Get the first parameter (typically there's only one per button)
                const buttonParam = buttonComponent.parameters[0];

                if (!buttonParam || !buttonParam.text) {
                    console.log(
                        `[Button Replacement] No valid parameter found for button ${buttonIndex}`,
                    );
                    return;
                }

                const replaceValue = buttonParam.text;

                // Replace variables in URL
                if (button.url) {
                    const originalUrl = button.url;
                    const urlVariables = this.extractVariables(button.url);

                    if (urlVariables.length > 0) {
                        const hasExample = button.example && button.example.length > 0;

                        urlVariables.forEach((variable, i) => {
                            if (hasExample) {
                                // Use numeric replacement for templates with examples ({{1}}, {{2}}, etc.)
                                const pattern = `\\{\\{${i + 1}\\}\\}`;

                                button.url = button.url!.replace(
                                    new RegExp(pattern, "g"),
                                    replaceValue,
                                );
                            } else {
                                // Use named variable replacement
                                const escapedVariable = variable.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&",
                                );
                                const pattern = `\\{\\{${escapedVariable}\\}\\}`;

                                button.url = button.url!.replace(
                                    new RegExp(pattern, "g"),
                                    replaceValue,
                                );
                            }
                        });

                        console.log(
                            `[Button Replacement] URL replaced: "${originalUrl}" -> "${button.url}"`,
                        );
                    }
                }

                // Replace variables in text (for payload buttons or other button types)
                if (button.text) {
                    const originalText = button.text;
                    const textVariables = this.extractVariables(button.text);

                    if (textVariables.length > 0) {
                        textVariables.forEach((variable, i) => {
                            // Use named variable replacement
                            const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            button.text = button.text!.replace(
                                new RegExp(`\\{\\{${escapedVariable}\\}\\}`, "g"),
                                replaceValue,
                            );
                        });
                        console.log(
                            `[Button Replacement] Text replaced: "${originalText}" -> "${button.text}"`,
                        );
                    }
                }

                // Replace variables in phone_number
                if (button.phone_number) {
                    const originalPhone = button.phone_number;
                    const phoneVariables = this.extractVariables(button.phone_number);

                    if (phoneVariables.length > 0) {
                        phoneVariables.forEach((variable, i) => {
                            // Use named variable replacement
                            const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            button.phone_number = button.phone_number!.replace(
                                new RegExp(`\\{\\{${escapedVariable}\\}\\}`, "g"),
                                replaceValue,
                            );
                        });
                        console.log(
                            `[Button Replacement] Phone replaced: "${originalPhone}" -> "${button.phone_number}"`,
                        );
                    }
                }
            } catch (error) {
                // If component not found or parameter doesn't exist, skip replacement
                console.error("[Button Replacement] Error replacing button variables:", error);
            }
        });

        console.log("[Button Replacement] Final buttons:", buttons);
        return buttons;
    }

    private findComponentParameter(
        componentType: TemplateComponentType,
        index: number,
        getTemplateData: () => UseTemplate,
    ): ComponentParameters {
        const component = getTemplateData().components.find(
            comp => comp.type.toLowerCase() === componentType.toLowerCase(),
        );
        if (!component) {
            throw new Error(`Component not found for ${componentType}`);
        }
        return component.parameters[index];
    }

    /**
     * Extracts all variables from a text string, supporting both {{number}} and {{name}} formats
     * @param text The text to extract variables from
     * @returns Array of variable names/numbers found in the text
     */
    private extractVariables(text: string): string[] {
        const variableRegex = /\{\{([^}]+)\}\}/g;
        const variables: string[] = [];
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            variables.push(match[1].trim());
        }

        return variables;
    }
}
