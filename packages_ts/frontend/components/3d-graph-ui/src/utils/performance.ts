/**
 * Performance Utility Functions
 *
 * This file contains utility functions for performance monitoring and optimization
 * in the 3D graph visualization.
 */

/**
 * Simple performance timer for measuring execution time
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;
  private running: boolean = false;
  private name: string;

  /**
   * Create a new performance timer
   *
   * @param name Optional name for the timer
   */
  constructor(name: string = "Timer") {
    this.name = name;
  }

  /**
   * Start the timer
   *
   * @returns This timer instance for chaining
   */
  start(): PerformanceTimer {
    this.startTime = performance.now();
    this.running = true;
    return this;
  }

  /**
   * Stop the timer
   *
   * @returns This timer instance for chaining
   */
  stop(): PerformanceTimer {
    this.endTime = performance.now();
    this.running = false;
    return this;
  }

  /**
   * Get the elapsed time in milliseconds
   *
   * @returns The elapsed time, or current elapsed time if still running
   */
  getElapsedTime(): number {
    if (this.running) {
      return performance.now() - this.startTime;
    }
    return this.endTime - this.startTime;
  }

  /**
   * Log the elapsed time to the console
   *
   * @param message Optional message to include in the log
   * @returns This timer instance for chaining
   */
  log(message?: string): PerformanceTimer {
    const elapsed = this.getElapsedTime();
    console.log(
      `${this.name}: ${message ? message + " - " : ""}${elapsed.toFixed(2)}ms`
    );
    return this;
  }

  /**
   * Reset the timer
   *
   * @returns This timer instance for chaining
   */
  reset(): PerformanceTimer {
    this.startTime = 0;
    this.endTime = 0;
    this.running = false;
    return this;
  }
}

/**
 * Performance metrics collector for tracking various metrics over time
 */
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples: number;

  /**
   * Create a new performance metrics collector
   *
   * @param maxSamples Maximum number of samples to keep for each metric
   */
  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }

  /**
   * Add a metric sample
   *
   * @param name The name of the metric
   * @param value The value to add
   */
  addSample(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const samples = this.metrics.get(name)!;
    samples.push(value);

    // Keep only the most recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  /**
   * Get the average value of a metric
   *
   * @param name The name of the metric
   * @returns The average value, or 0 if no samples exist
   */
  getAverage(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;

    const sum = samples.reduce((acc, val) => acc + val, 0);
    return sum / samples.length;
  }

  /**
   * Get the minimum value of a metric
   *
   * @param name The name of the metric
   * @returns The minimum value, or 0 if no samples exist
   */
  getMin(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;

    return Math.min(...samples);
  }

  /**
   * Get the maximum value of a metric
   *
   * @param name The name of the metric
   * @returns The maximum value, or 0 if no samples exist
   */
  getMax(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;

    return Math.max(...samples);
  }

  /**
   * Get all samples for a metric
   *
   * @param name The name of the metric
   * @returns Array of samples, or empty array if no samples exist
   */
  getSamples(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get the most recent sample for a metric
   *
   * @param name The name of the metric
   * @returns The most recent sample, or 0 if no samples exist
   */
  getLatest(name: string): number {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) return 0;

    return samples[samples.length - 1];
  }

  /**
   * Get a summary of all metrics
   *
   * @returns Object containing metric summaries
   */
  getSummary(): Record<
    string,
    { avg: number; min: number; max: number; latest: number }
  > {
    const summary: Record<
      string,
      { avg: number; min: number; max: number; latest: number }
    > = {};

    this.metrics.forEach((_, name) => {
      summary[name] = {
        avg: this.getAverage(name),
        min: this.getMin(name),
        max: this.getMax(name),
        latest: this.getLatest(name),
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear a specific metric
   *
   * @param name The name of the metric to clear
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }
}

/**
 * Throttle a function to limit how often it can be called
 *
 * @param func The function to throttle
 * @param limit The minimum time between function calls in milliseconds
 * @returns The throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let lastResult: ReturnType<T>;

  return function (
    this: unknown,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      lastResult = func.apply(this, args) as ReturnType<T>;
      return lastResult;
    }
    return undefined;
  };
}

/**
 * Debounce a function to delay its execution until after a period of inactivity
 *
 * @param func The function to debounce
 * @param wait The time to wait in milliseconds
 * @param immediate Whether to call the function immediately on the leading edge
 * @returns The debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

/**
 * Measure the execution time of a function
 *
 * @param func The function to measure
 * @param name Optional name for the measurement
 * @returns A wrapped function that logs its execution time
 */
export function measureExecutionTime<T extends (...args: unknown[]) => unknown>(
  func: T,
  name: string = func.name || "Anonymous Function"
): (...args: Parameters<T>) => ReturnType<T> {
  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
    return result as ReturnType<T>;
  };
}

/**
 * Create a function that runs with requestAnimationFrame for better performance
 *
 * @param callback The function to run
 * @returns A function that schedules the callback with requestAnimationFrame
 */
export function rafScheduled<T extends (...args: unknown[]) => unknown>(
  callback: T
): (...args: Parameters<T>) => void {
  let scheduled = false;
  let lastArgs: Parameters<T>;

  return function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;

    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        callback.apply(this, lastArgs);
      });
    }
  };
}

/**
 * Check if the current device is likely a low-performance device
 *
 * @returns True if the device is likely a low-performance device
 */
export function isLowPerformanceDevice(): boolean {
  // Check for mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Check for low memory (if available)
  const hasLowMemory =
    // @ts-expect-error - deviceMemory is not in the standard navigator type
    typeof navigator.deviceMemory !== "undefined" && navigator.deviceMemory < 4;

  // Check for low number of logical processors
  const hasLowCPU =
    typeof navigator.hardwareConcurrency !== "undefined" &&
    navigator.hardwareConcurrency < 4;

  // Consider it a low-performance device if it's mobile or has low specs
  return isMobile || hasLowMemory || hasLowCPU;
}
