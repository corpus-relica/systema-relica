import { makeAutoObservable } from "mobx";
import { LayoutPlugin } from "./LayoutPlugin.js";

/**
 * Registry for layout algorithm plugins
 *
 * Manages the registration and selection of layout plugins
 */
export class LayoutRegistry {
  private plugins: Map<string, LayoutPlugin> = new Map();
  private activePluginId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Register a layout plugin
   * @param plugin The layout plugin to register
   * @returns true if the plugin was registered, false if a plugin with the same ID already exists
   */
  registerPlugin(plugin: LayoutPlugin): boolean {
    if (this.plugins.has(plugin.id)) {
      console.warn(
        `Layout plugin with ID ${plugin.id} already exists. Use a unique ID.`
      );
      return false;
    }

    this.plugins.set(plugin.id, plugin);

    // If this is the first plugin, make it active
    if (this.plugins.size === 1) {
      this.activePluginId = plugin.id;
    }

    return true;
  }

  /**
   * Unregister a layout plugin
   * @param id The ID of the plugin to unregister
   * @returns true if the plugin was unregistered, false if no plugin with the ID exists
   */
  unregisterPlugin(id: string): boolean {
    if (!this.plugins.has(id)) {
      return false;
    }

    this.plugins.delete(id);

    // If the active plugin was removed, select a new one
    if (this.activePluginId === id) {
      this.activePluginId =
        this.plugins.size > 0 ? Array.from(this.plugins.keys())[0] : null;
    }

    return true;
  }

  /**
   * Get a plugin by ID
   * @param id The ID of the plugin to get
   * @returns The plugin, or undefined if no plugin with the ID exists
   */
  getPlugin(id: string): LayoutPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins
   * @returns An array of all registered plugins
   */
  getAllPlugins(): LayoutPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Set the active plugin
   * @param id The ID of the plugin to set as active
   * @returns true if the plugin was set as active, false if no plugin with the ID exists
   */
  setActivePlugin(id: string): boolean {
    if (!this.plugins.has(id)) {
      return false;
    }

    this.activePluginId = id;
    return true;
  }

  /**
   * Get the active plugin
   * @returns The active plugin, or null if no plugin is active
   */
  getActivePlugin(): LayoutPlugin | null {
    if (!this.activePluginId) {
      return null;
    }

    return this.plugins.get(this.activePluginId) || null;
  }

  /**
   * Get the ID of the active plugin
   * @returns The ID of the active plugin, or null if no plugin is active
   */
  get activePlugin(): string | null {
    return this.activePluginId;
  }

  /**
   * Check if a plugin with the given ID exists
   * @param id The ID to check
   * @returns true if a plugin with the ID exists, false otherwise
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get the number of registered plugins
   * @returns The number of registered plugins
   */
  get pluginCount(): number {
    return this.plugins.size;
  }
}

export default LayoutRegistry;
