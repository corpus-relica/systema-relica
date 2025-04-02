/**
 * Utility functions for the Quintessential Model Visualization component
 */

import { ModelElement } from './types';

// Color mapping for different element categories
const categoryColors: Record<string, string> = {
  'physical object': '#4CAF50', // Green
  'occurrence': '#2196F3',      // Blue
  'role': '#FFC107',            // Amber
  'aspect': '#9C27B0',          // Purple
  'information': '#607D8B',     // Blue Grey
  'relation': '#FF5722',        // Deep Orange
  'default': '#CCCCCC'          // Light Grey
};

// Nature-based colors (fallback if category is not available)
const natureColors: Record<string, string> = {
  'kind': '#3F51B5',            // Indigo
  'role': '#FFC107',            // Amber
  'default': '#CCCCCC'          // Light Grey
};

/**
 * Get the appropriate color for a model element based on its category or nature
 */
export const getElementColor = (element: ModelElement): string => {
  // If element has a category, use the category color
  if (element.category) {
    return categoryColors[element.category.toLowerCase()] || categoryColors.default;
  }
  
  // Otherwise, use the nature color
  if (element.nature) {
    return natureColors[element.nature.toLowerCase()] || natureColors.default;
  }
  
  return categoryColors.default;
};

/**
 * Format a definition string for display
 */
export const formatDefinition = (definition: string): string => {
  if (!definition) return '';
  
  // Capitalize first letter and ensure it ends with a period
  let formattedDef = definition.trim();
  formattedDef = formattedDef.charAt(0).toUpperCase() + formattedDef.slice(1);
  
  if (!formattedDef.endsWith('.')) {
    formattedDef += '.';
  }
  
  return formattedDef;
};