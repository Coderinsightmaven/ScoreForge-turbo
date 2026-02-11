export const BRAND_COLOR = "#70ac15";
export const BRAND_COLOR_DARK = "#adff33";
export const PAGE_BG_LIGHT = "#f5f7f9";
export const PAGE_BG_DARK = "#101219";
export const TEXT_LIGHT = "#868c98";
export const TEXT_LIGHT_DARK = "#6a7181";

export function getStackBackground(colorScheme: "light" | "dark" | undefined | null) {
  return colorScheme === "dark" ? PAGE_BG_DARK : PAGE_BG_LIGHT;
}

export function getPlaceholderColor(colorScheme: "light" | "dark" | undefined | null) {
  return colorScheme === "dark" ? TEXT_LIGHT_DARK : TEXT_LIGHT;
}
