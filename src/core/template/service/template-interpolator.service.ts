import { Injectable } from "@angular/core";
import { Template } from "../../template/model/template.model";
import { Conversation } from "../../message/model/conversation.model";
import { MessageType } from "../../message/model/message-type.model";
import { UseTemplate } from "../../message/model/use-template.model";
import { ComponentParameters } from "../../message/model/use-template-component.model";
import { UseMedia } from "../../message/model/media-data.model";
import {
    TemplateButton,
    TemplateComponent,
} from "../model/template-component.model";
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

        template.components.forEach((component) => {
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

    private loadHeader(
        component: TemplateComponent,
        getTemplateData: () => UseTemplate,
    ) {
        const example = component.example;
        let headerType: MessageType = component?.format
            ? (component?.format.toLowerCase() as MessageType)
            : MessageType.text;
        let headerText = "";
        let headerUseMedia: UseMedia = {};

        if (
            example?.header_handle &&
            component.format?.toLowerCase() !==
                TemplateComponentFormat.Text.toLowerCase()
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
                const media = (componentParams as any)[
                    key
                ] as UseMedia[keyof UseMedia];

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
            component.format?.toLowerCase() ===
                TemplateComponentFormat.Text.toLowerCase() &&
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
                        const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    private loadBody(
        component: TemplateComponent,
        getTemplateData: () => UseTemplate,
    ): string {
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
                    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

        // Track parameter index across all buttons
        let parameterIndex = 0;

        buttons.forEach(button => {
            if (button.url) {
                const variables = this.extractVariables(button.url);

                if (variables.length > 0) {
                    // Check if we have example data
                    const hasExample = button.example && button.example.length > 0;

                    variables.forEach((variable, i) => {
                        try {
                            const replaceAtIndex = this.findComponentParameter(
                                TemplateComponentType.buttons,
                                parameterIndex,
                                getTemplateData,
                            ).text;

                            if (replaceAtIndex) {
                                if (hasExample) {
                                    // Use numeric replacement for templates with examples
                                    button.url = button.url!.replace(
                                        new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"),
                                        replaceAtIndex,
                                    );
                                } else {
                                    // Use named variable replacement
                                    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    button.url = button.url!.replace(
                                        new RegExp(`\\{\\{${escapedVariable}\\}\\}`, "g"),
                                        replaceAtIndex,
                                    );
                                }
                            }
                            parameterIndex++;
                        } catch (error) {
                            // If component not found or parameter doesn't exist, skip replacement
                            console.warn('Failed to replace button variable:', error);
                        }
                    });
                }
            }
        });

        return buttons;
    }

    private findComponentParameter(
        componentType: TemplateComponentType,
        index: number,
        getTemplateData: () => UseTemplate,
    ): ComponentParameters {
        const component = getTemplateData().components.find(
            (comp) => comp.type.toLowerCase() === componentType.toLowerCase(),
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
