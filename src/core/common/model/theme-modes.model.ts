export enum ThemeMode {
    dark = "dark",
    light = "light",
    system = "system",
}

export function getThemeMode(theme?: string | null): ThemeMode {
    // Check if the stored value is a valid ThemeMode
    if (theme && Object.values(ThemeMode).includes(theme as ThemeMode)) return theme as ThemeMode;

    return ThemeMode.system; // Default fallback
}
