import type { ColorParseResult } from './types.js'
import { VUETIFY_COLORS } from './types.js'

/**
 * Parses a message to check if it's a color command
 * Format: /color <color> <message>
 * Example: /color blue Hello World!
 */
export function parseColorCommand(input: string): ColorParseResult {
  const trimmed = input.trim()
  
  // Check if message starts with /color
  if (!trimmed.startsWith('/color ')) {
    return { isColorCommand: false }
  }
  
  // Remove /color prefix
  const withoutPrefix = trimmed.substring(7).trim()
  
  // Find the first space to separate color from message
  const firstSpaceIndex = withoutPrefix.indexOf(' ')
  
  if (firstSpaceIndex === -1) {
    // No space found, treat entire string as color
    return { isColorCommand: false }
  }
  
  const color = withoutPrefix.substring(0, firstSpaceIndex).toLowerCase()
  const message = withoutPrefix.substring(firstSpaceIndex + 1).trim()
  
  if (!message) {
    // No message after color
    return { isColorCommand: false }
  }
  
  // Check if color is valid (either in our mapping or a valid HTML color)
  const isValidColor = isValidHtmlColor(color) || VUETIFY_COLORS[color]
  
  if (!isValidColor) {
    return { isColorCommand: false }
  }
  
  return {
    isColorCommand: true,
    color: color,
    message: message
  }
}

/**
 * Checks if a string is a valid HTML color
 * Supports hex colors (#fff, #ffffff), named colors, rgb(), rgba(), hsl(), hsla()
 */
function isValidHtmlColor(color: string): boolean {
  // Create a temporary element to test the color
  const tempElement = document.createElement('div')
  tempElement.style.color = color
  
  // If the color is valid, it will be applied
  return tempElement.style.color !== ''
}

/**
 * Gets the appropriate Vuetify color class for a given color
 * Only returns predefined Vuetify colors, falls back to grey for unknown colors
 */
export function getVuetifyColorClass(color: string): string {
  const lowerColor = color.toLowerCase()
  
  // Check if it's in our predefined mapping
  if (VUETIFY_COLORS[lowerColor]) {
    return VUETIFY_COLORS[lowerColor]
  }
  
  // For unknown colors, fall back to grey
  return 'grey'
}
