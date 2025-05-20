import { makeAutoObservable } from "mobx";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";
import * as THREE from "three";

/**
 * Node style properties
 */
export interface NodeStyle {
  color: string;
  size: number;
  opacity: number;
  shape: "sphere" | "box" | "cylinder" | "cone" | "custom";
  outlineColor?: string;
  outlineWidth?: number;
  texture?: string;
  textureScale?: number;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  labelVisible?: boolean;
  labelColor?: string;
  labelSize?: number;
  labelOffset?: [number, number, number];
  customMesh?: string; // Path to custom mesh for "custom" shape
}

/**
 * Edge style properties
 */
export interface EdgeStyle {
  color: string;
  width: number;
  opacity: number;
  type: "line" | "tube" | "arrow" | "dashed";
  dashSize?: number;
  gapSize?: number;
  arrowSize?: number;
  arrowPosition?: number; // 0-1, position along the edge
  texture?: string;
  textureScale?: number;
  labelVisible?: boolean;
  labelColor?: string;
  labelSize?: number;
  labelOffset?: [number, number, number];
}

/**
 * Theme interface for consistent styling
 */
export interface Theme {
  name: string;
  background: string;
  nodeStyles: Record<string, NodeStyle>;
  edgeStyles: Record<string, EdgeStyle>;
  defaultNodeStyle: NodeStyle;
  defaultEdgeStyle: EdgeStyle;
}

/**
 * Style rule for conditional styling
 */
export interface StyleRule<T, S> {
  id: string;
  name: string;
  condition: (entity: T) => boolean;
  style: Partial<S>;
  priority: number;
}

/**
 * Style preset for quick application
 */
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  nodeStyles: Record<string, Partial<NodeStyle>>;
  edgeStyles: Record<string, Partial<EdgeStyle>>;
}

/**
 * Default light theme
 */
export const LIGHT_THEME: Theme = {
  name: "Light",
  background: "#f5f5f5",
  defaultNodeStyle: {
    color: "#4285F4",
    size: 1,
    opacity: 1,
    shape: "sphere",
    outlineColor: "#ffffff",
    outlineWidth: 0.1,
    metalness: 0.2,
    roughness: 0.7,
    labelVisible: true,
    labelColor: "#000000",
    labelSize: 1,
    labelOffset: [0, 1.5, 0],
  },
  defaultEdgeStyle: {
    color: "#999999",
    width: 0.5,
    opacity: 0.8,
    type: "line",
    labelVisible: false,
    labelColor: "#000000",
    labelSize: 1,
  },
  nodeStyles: {
    default: {
      color: "#4285F4",
      size: 1,
      opacity: 1,
      shape: "sphere",
    },
    highlighted: {
      color: "#FBBC05",
      size: 1.2,
      opacity: 1,
      shape: "sphere",
      outlineColor: "#ffffff",
      outlineWidth: 0.2,
      emissive: "#FBBC05",
      emissiveIntensity: 0.3,
    },
    selected: {
      color: "#EA4335",
      size: 1.3,
      opacity: 1,
      shape: "sphere",
      outlineColor: "#ffffff",
      outlineWidth: 0.3,
      emissive: "#EA4335",
      emissiveIntensity: 0.5,
    },
  },
  edgeStyles: {
    default: {
      color: "#999999",
      width: 0.5,
      opacity: 0.8,
      type: "line",
    },
    highlighted: {
      color: "#FBBC05",
      width: 1,
      opacity: 1,
      type: "tube",
    },
    selected: {
      color: "#EA4335",
      width: 1.5,
      opacity: 1,
      type: "tube",
    },
  },
};

/**
 * Default dark theme
 */
export const DARK_THEME: Theme = {
  name: "Dark",
  background: "#1e1e1e",
  defaultNodeStyle: {
    color: "#4285F4",
    size: 1,
    opacity: 1,
    shape: "sphere",
    outlineColor: "#333333",
    outlineWidth: 0.1,
    metalness: 0.5,
    roughness: 0.5,
    labelVisible: true,
    labelColor: "#ffffff",
    labelSize: 1,
    labelOffset: [0, 1.5, 0],
  },
  defaultEdgeStyle: {
    color: "#666666",
    width: 0.5,
    opacity: 0.8,
    type: "line",
    labelVisible: false,
    labelColor: "#ffffff",
    labelSize: 1,
  },
  nodeStyles: {
    default: {
      color: "#4285F4",
      size: 1,
      opacity: 1,
      shape: "sphere",
    },
    highlighted: {
      color: "#FBBC05",
      size: 1.2,
      opacity: 1,
      shape: "sphere",
      outlineColor: "#333333",
      outlineWidth: 0.2,
      emissive: "#FBBC05",
      emissiveIntensity: 0.5,
    },
    selected: {
      color: "#EA4335",
      size: 1.3,
      opacity: 1,
      shape: "sphere",
      outlineColor: "#333333",
      outlineWidth: 0.3,
      emissive: "#EA4335",
      emissiveIntensity: 0.7,
    },
  },
  edgeStyles: {
    default: {
      color: "#666666",
      width: 0.5,
      opacity: 0.8,
      type: "line",
    },
    highlighted: {
      color: "#FBBC05",
      width: 1,
      opacity: 1,
      type: "tube",
    },
    selected: {
      color: "#EA4335",
      width: 1.5,
      opacity: 1,
      type: "tube",
    },
  },
};

/**
 * Style system for customizing node and edge appearance
 */
export class StyleSystem {
  private themes: Map<string, Theme> = new Map();
  private activeTheme: string;
  private nodeRules: StyleRule<INodeEntity, NodeStyle>[] = [];
  private edgeRules: StyleRule<IEdgeEntity, EdgeStyle>[] = [];
  private presets: Map<string, StylePreset> = new Map();
  private nodeStyleCache: Map<number, NodeStyle> = new Map();
  private edgeStyleCache: Map<number, EdgeStyle> = new Map();
  private cacheInvalidated: boolean = true;

  constructor() {
    // Register default themes
    this.themes.set("light", LIGHT_THEME);
    this.themes.set("dark", DARK_THEME);
    this.activeTheme = "light";

    makeAutoObservable(this);
  }

  /**
   * Register a new theme
   */
  registerTheme(id: string, theme: Theme): void {
    this.themes.set(id, theme);
    this.invalidateCache();
  }

  /**
   * Set the active theme
   */
  setActiveTheme(id: string): boolean {
    if (!this.themes.has(id)) {
      return false;
    }

    this.activeTheme = id;
    this.invalidateCache();
    return true;
  }

  /**
   * Get the active theme
   */
  getActiveTheme(): Theme {
    return this.themes.get(this.activeTheme) || LIGHT_THEME;
  }

  /**
   * Get all registered themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Add a node style rule
   */
  addNodeRule(rule: StyleRule<INodeEntity, NodeStyle>): void {
    this.nodeRules.push(rule);
    this.nodeRules.sort((a, b) => b.priority - a.priority);
    this.invalidateCache();
  }

  /**
   * Remove a node style rule
   */
  removeNodeRule(id: string): boolean {
    const initialLength = this.nodeRules.length;
    this.nodeRules = this.nodeRules.filter((rule) => rule.id !== id);

    if (this.nodeRules.length !== initialLength) {
      this.invalidateCache();
      return true;
    }

    return false;
  }

  /**
   * Add an edge style rule
   */
  addEdgeRule(rule: StyleRule<IEdgeEntity, EdgeStyle>): void {
    this.edgeRules.push(rule);
    this.edgeRules.sort((a, b) => b.priority - a.priority);
    this.invalidateCache();
  }

  /**
   * Remove an edge style rule
   */
  removeEdgeRule(id: string): boolean {
    const initialLength = this.edgeRules.length;
    this.edgeRules = this.edgeRules.filter((rule) => rule.id !== id);

    if (this.edgeRules.length !== initialLength) {
      this.invalidateCache();
      return true;
    }

    return false;
  }

  /**
   * Register a style preset
   */
  registerPreset(preset: StylePreset): void {
    this.presets.set(preset.id, preset);
  }

  /**
   * Apply a style preset
   */
  applyPreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset) {
      return false;
    }

    const theme = this.getActiveTheme();

    // Apply node styles from preset
    Object.entries(preset.nodeStyles).forEach(([key, style]) => {
      theme.nodeStyles[key] = { ...theme.nodeStyles[key], ...style };
    });

    // Apply edge styles from preset
    Object.entries(preset.edgeStyles).forEach(([key, style]) => {
      theme.edgeStyles[key] = { ...theme.edgeStyles[key], ...style };
    });

    this.invalidateCache();
    return true;
  }

  /**
   * Get style for a node
   */
  getNodeStyle(node: INodeEntity): NodeStyle {
    // Check cache first
    if (!this.cacheInvalidated && this.nodeStyleCache.has(node.id)) {
      return this.nodeStyleCache.get(node.id)!;
    }

    const theme = this.getActiveTheme();
    let style = { ...theme.defaultNodeStyle };

    // Apply rules in priority order
    for (const rule of this.nodeRules) {
      if (rule.condition(node)) {
        style = { ...style, ...rule.style };
      }
    }

    // Cache the result
    this.nodeStyleCache.set(node.id, style);

    return style;
  }

  /**
   * Get style for an edge
   */
  getEdgeStyle(edge: IEdgeEntity): EdgeStyle {
    // Check cache first
    if (!this.cacheInvalidated && this.edgeStyleCache.has(edge.id)) {
      return this.edgeStyleCache.get(edge.id)!;
    }

    const theme = this.getActiveTheme();
    let style = { ...theme.defaultEdgeStyle };

    // Apply rules in priority order
    for (const rule of this.edgeRules) {
      if (rule.condition(edge)) {
        style = { ...style, ...rule.style };
      }
    }

    // Cache the result
    this.edgeStyleCache.set(edge.id, style);

    return style;
  }

  /**
   * Create a Three.js material from a node style
   */
  createNodeMaterial(style: NodeStyle): THREE.Material {
    const color = new THREE.Color(style.color);

    const materialParams: THREE.MeshStandardMaterialParameters = {
      color,
      transparent: style.opacity < 1,
      opacity: style.opacity,
      metalness: style.metalness || 0.2,
      roughness: style.roughness || 0.7,
    };

    if (style.emissive) {
      materialParams.emissive = new THREE.Color(style.emissive);
      materialParams.emissiveIntensity = style.emissiveIntensity || 0.5;
    }

    return new THREE.MeshStandardMaterial(materialParams);
  }

  /**
   * Create a Three.js material from an edge style
   */
  createEdgeMaterial(style: EdgeStyle): THREE.Material {
    const color = new THREE.Color(style.color);

    if (style.type === "dashed") {
      return new THREE.LineDashedMaterial({
        color,
        linewidth: style.width,
        transparent: style.opacity < 1,
        opacity: style.opacity,
        dashSize: style.dashSize || 3,
        gapSize: style.gapSize || 1,
      });
    } else {
      return new THREE.LineBasicMaterial({
        color,
        linewidth: style.width,
        transparent: style.opacity < 1,
        opacity: style.opacity,
      });
    }
  }

  /**
   * Invalidate the style cache
   */
  private invalidateCache(): void {
    this.cacheInvalidated = true;
    this.nodeStyleCache.clear();
    this.edgeStyleCache.clear();
  }

  /**
   * Reset the style cache validation state
   * Call this after processing all nodes/edges in a render cycle
   */
  resetCacheValidation(): void {
    this.cacheInvalidated = false;
  }
}

export default StyleSystem;
