/**
 * Color Utility Functions
 *
 * This file contains utility functions for color operations used in the 3D graph.
 * These functions help with color manipulation, conversion, and generation.
 */

import * as THREE from "three";
import { CATEGORY_COLORS } from "../config/constants.js";

/**
 * Convert a hex color string to an RGB object
 *
 * @param hex The hex color string (e.g., "#ff0000" or "ff0000")
 * @returns The RGB color object with values from 0-1
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Convert an RGB object to a hex color string
 *
 * @param rgb The RGB color object with values from 0-1
 * @returns The hex color string with a leading hash
 */
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  // Convert to 0-255 range and format as hex
  const r = Math.round(rgb.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(rgb.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(rgb.b * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
}

/**
 * Convert a hex color string to a THREE.Color
 *
 * @param hex The hex color string
 * @returns A THREE.Color object
 */
export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Convert a THREE.Color to a hex color string
 *
 * @param color The THREE.Color object
 * @returns The hex color string with a leading hash
 */
export function threeColorToHex(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

/**
 * Brighten a color by a specified amount
 *
 * @param color The color to brighten (hex string)
 * @param amount The amount to brighten (0-1)
 * @returns The brightened color as a hex string
 */
export function brightenColor(color: string, amount: number): string {
  const threeColor = new THREE.Color(color);

  // Use HSL to brighten the color
  const hsl = { h: 0, s: 0, l: 0 };
  threeColor.getHSL(hsl);

  // Increase lightness, but cap at 1
  hsl.l = Math.min(1, hsl.l + amount);

  // Set the new HSL values
  threeColor.setHSL(hsl.h, hsl.s, hsl.l);

  return `#${threeColor.getHexString()}`;
}

/**
 * Darken a color by a specified amount
 *
 * @param color The color to darken (hex string)
 * @param amount The amount to darken (0-1)
 * @returns The darkened color as a hex string
 */
export function darkenColor(color: string, amount: number): string {
  const threeColor = new THREE.Color(color);

  // Use HSL to darken the color
  const hsl = { h: 0, s: 0, l: 0 };
  threeColor.getHSL(hsl);

  // Decrease lightness, but keep above 0
  hsl.l = Math.max(0, hsl.l - amount);

  // Set the new HSL values
  threeColor.setHSL(hsl.h, hsl.s, hsl.l);

  return `#${threeColor.getHexString()}`;
}

/**
 * Get a color for a node based on its category
 *
 * @param category The node category
 * @returns The color as a hex string
 */
export function getNodeColorByCategory(category: string): string {
  switch (category) {
    case "Physical Object":
      return CATEGORY_COLORS.PHYSICAL_OBJECT;
    case "Occurrence":
      return CATEGORY_COLORS.OCCURRENCE;
    case "Role":
      return CATEGORY_COLORS.ROLE;
    case "Aspect":
      return CATEGORY_COLORS.ASPECT;
    case "Relation":
      return CATEGORY_COLORS.RELATION;
    case "Root":
      return CATEGORY_COLORS.ROOT;
    default:
      return CATEGORY_COLORS.DEFAULT;
  }
}

/**
 * Interpolate between two colors
 *
 * @param color1 The first color (hex string)
 * @param color2 The second color (hex string)
 * @param t The interpolation factor (0-1)
 * @returns The interpolated color as a hex string
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);

  // Clamp t to 0-1 range
  t = Math.max(0, Math.min(1, t));

  // Interpolate the colors
  const result = new THREE.Color();
  result.r = c1.r + (c2.r - c1.r) * t;
  result.g = c1.g + (c2.g - c1.g) * t;
  result.b = c1.b + (c2.b - c1.b) * t;

  return `#${result.getHexString()}`;
}

/**
 * Generate a color palette with a specified number of colors
 *
 * @param count The number of colors to generate
 * @param saturation The saturation value (0-1)
 * @param lightness The lightness value (0-1)
 * @returns An array of hex color strings
 */
export function generateColorPalette(
  count: number,
  saturation: number = 0.7,
  lightness: number = 0.5
): string[] {
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    // Distribute hues evenly around the color wheel
    const hue = i / count;

    const color = new THREE.Color();
    color.setHSL(hue, saturation, lightness);

    colors.push(`#${color.getHexString()}`);
  }

  return colors;
}

/**
 * Calculate a contrasting text color (black or white) based on background color
 *
 * @param backgroundColor The background color (hex string)
 * @returns "#000000" for dark text or "#ffffff" for light text
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const color = new THREE.Color(backgroundColor);

  // Calculate perceived brightness using the formula
  // (0.299*R + 0.587*G + 0.114*B)
  const brightness = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;

  // Use white text for dark backgrounds, black text for light backgrounds
  return brightness > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Adjust the opacity of a color
 *
 * @param color The color (hex string)
 * @param opacity The opacity value (0-1)
 * @returns The color with opacity as an rgba string
 */
export function setColorOpacity(color: string, opacity: number): string {
  const { r, g, b } = hexToRgb(color);

  // Convert back to 0-255 range for rgba string
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);

  return `rgba(${rInt}, ${gInt}, ${bInt}, ${opacity})`;
}
