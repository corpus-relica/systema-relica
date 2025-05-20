import * as THREE from "three";

/**
 * Service for managing and reusing materials in the 3D graph
 *
 * This service implements material pooling and reuse to reduce
 * the number of material instances and material property updates.
 */
export class MaterialService {
  private static instance: MaterialService;

  // Material pools for different types of materials
  private nodeMaterials: Map<string, THREE.Material>;
  private edgeMaterials: Map<string, THREE.Material>;
  private highlightMaterials: Map<string, THREE.Material>;
  private textMaterials: Map<string, THREE.Material>;

  // Default materials
  private defaultNodeMaterial: THREE.MeshBasicMaterial;
  private defaultEdgeMaterial: THREE.MeshBasicMaterial;
  private defaultHighlightMaterial: THREE.MeshBasicMaterial;
  private defaultTextMaterial: THREE.MeshBasicMaterial;

  // LOD materials (for different detail levels)
  private lodMaterials: Map<string, THREE.Material[]>;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.nodeMaterials = new Map();
    this.edgeMaterials = new Map();
    this.highlightMaterials = new Map();
    this.textMaterials = new Map();
    this.lodMaterials = new Map();

    // Initialize default materials
    this.defaultNodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.defaultEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    this.defaultHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    this.defaultTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Add default materials to pools
    this.nodeMaterials.set("default", this.defaultNodeMaterial);
    this.edgeMaterials.set("default", this.defaultEdgeMaterial);
    this.highlightMaterials.set("default", this.defaultHighlightMaterial);
    this.textMaterials.set("default", this.defaultTextMaterial);
  }

  /**
   * Get the singleton instance of the MaterialService
   */
  public static getInstance(): MaterialService {
    if (!MaterialService.instance) {
      MaterialService.instance = new MaterialService();
    }
    return MaterialService.instance;
  }

  /**
   * Get a node material by color
   * If the material doesn't exist, it will be created and cached
   *
   * @param color The color of the material
   * @param isSelected Whether the node is selected
   * @param isHovered Whether the node is hovered
   * @returns The material
   */
  public getNodeMaterial(
    color: string | number,
    isSelected: boolean = false,
    isHovered: boolean = false
  ): THREE.Material {
    const key = `node-${color}-${isSelected ? "selected" : ""}-${isHovered ? "hovered" : ""}`;

    if (!this.nodeMaterials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isHovered ? 0.8 : 1.0,
      });

      // Note: MeshBasicMaterial doesn't have emissive properties
      // If we need emissive properties, we would use MeshStandardMaterial
      // For now, we'll just adjust the color for selected state
      if (isSelected) {
        // Brighten the color slightly for selected state
        const selectedColor = new THREE.Color(color);
        selectedColor.multiplyScalar(1.2); // Make it 20% brighter
        material.color = selectedColor;
      }

      this.nodeMaterials.set(key, material);
    }

    return this.nodeMaterials.get(key)!;
  }

  /**
   * Get an edge material by color
   * If the material doesn't exist, it will be created and cached
   *
   * @param color The color of the material
   * @param isSelected Whether the edge is selected
   * @param isHovered Whether the edge is hovered
   * @returns The material
   */
  public getEdgeMaterial(
    color: string | number,
    isSelected: boolean = false,
    isHovered: boolean = false
  ): THREE.Material {
    const key = `edge-${color}-${isSelected ? "selected" : ""}-${isHovered ? "hovered" : ""}`;

    if (!this.edgeMaterials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isHovered ? 0.8 : 0.6,
      });

      // Note: MeshBasicMaterial doesn't have emissive properties
      // If we need emissive properties, we would use MeshStandardMaterial
      // For now, we'll just adjust the color for selected state
      if (isSelected) {
        // Brighten the color slightly for selected state
        const selectedColor = new THREE.Color(color);
        selectedColor.multiplyScalar(1.2); // Make it 20% brighter
        material.color = selectedColor;
      }

      this.edgeMaterials.set(key, material);
    }

    return this.edgeMaterials.get(key)!;
  }

  /**
   * Get a text material by color
   * If the material doesn't exist, it will be created and cached
   *
   * @param color The color of the material
   * @returns The material
   */
  public getTextMaterial(color: string | number): THREE.Material {
    const key = `text-${color}`;

    if (!this.textMaterials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
      });

      this.textMaterials.set(key, material);
    }

    return this.textMaterials.get(key)!;
  }

  /**
   * Get a highlight material by color
   * If the material doesn't exist, it will be created and cached
   *
   * @param color The color of the material
   * @returns The material
   */
  public getHighlightMaterial(color: string | number): THREE.Material {
    const key = `highlight-${color}`;

    if (!this.highlightMaterials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
      });

      this.highlightMaterials.set(key, material);
    }

    return this.highlightMaterials.get(key)!;
  }

  /**
   * Get a material for a specific level of detail
   *
   * @param baseKey The base key for the material
   * @param lodLevel The level of detail (0 = highest detail, higher numbers = lower detail)
   * @returns The material for the specified LOD level
   */
  public getLODMaterial(baseKey: string, lodLevel: number): THREE.Material {
    if (!this.lodMaterials.has(baseKey)) {
      this.lodMaterials.set(baseKey, []);
    }

    const lodMaterials = this.lodMaterials.get(baseKey)!;

    if (!lodMaterials[lodLevel]) {
      // Create a new material for this LOD level
      // For lower detail levels, use simpler materials
      if (lodLevel === 0) {
        // Highest detail - use the original material
        const originalMaterial =
          this.nodeMaterials.get(baseKey) ||
          this.edgeMaterials.get(baseKey) ||
          this.defaultNodeMaterial;

        lodMaterials[lodLevel] = originalMaterial;
      } else {
        // Lower detail - create a simpler material
        const baseMaterial =
          this.nodeMaterials.get(baseKey) ||
          this.edgeMaterials.get(baseKey) ||
          this.defaultNodeMaterial;

        const color = (baseMaterial as THREE.MeshBasicMaterial).color;

        const simpleMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: Math.max(0.3, 1 - lodLevel * 0.2),
          wireframe: lodLevel > 2,
          // MeshBasicMaterial doesn't support flatShading
        });

        lodMaterials[lodLevel] = simpleMaterial;
      }
    }

    return lodMaterials[lodLevel];
  }

  /**
   * Dispose of all materials
   * Call this when the component is unmounted to prevent memory leaks
   */
  public dispose(): void {
    // Dispose of all materials in the pools
    this.nodeMaterials.forEach((material) => material.dispose());
    this.edgeMaterials.forEach((material) => material.dispose());
    this.highlightMaterials.forEach((material) => material.dispose());
    this.textMaterials.forEach((material) => material.dispose());

    // Dispose of LOD materials
    this.lodMaterials.forEach((materials) => {
      materials.forEach((material) => material.dispose());
    });

    // Clear the pools
    this.nodeMaterials.clear();
    this.edgeMaterials.clear();
    this.highlightMaterials.clear();
    this.textMaterials.clear();
    this.lodMaterials.clear();
  }
}

export default MaterialService;
