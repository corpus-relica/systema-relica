/**
 * Vector Utility Functions
 *
 * This file contains utility functions for vector operations used in the 3D graph.
 * These functions help with common vector calculations needed for physics,
 * spatial operations, and rendering.
 */

import { Position } from "../types.js";
import * as THREE from "three";

/**
 * Calculate the distance between two positions
 *
 * @param a First position
 * @param b Second position
 * @returns The distance between the positions
 */
export function distance(a: Position, b: Position): number {
  return Math.sqrt(distanceSquared(a, b));
}

/**
 * Calculate the squared distance between two positions
 * This is more efficient than calculating the actual distance when only
 * comparing distances (avoids square root calculation)
 *
 * @param a First position
 * @param b Second position
 * @returns The squared distance between the positions
 */
export function distanceSquared(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Convert a Position to a THREE.Vector3
 *
 * @param position The position to convert
 * @returns A THREE.Vector3 with the same coordinates
 */
export function positionToVector3(position: Position): THREE.Vector3 {
  return new THREE.Vector3(position.x, position.y, position.z);
}

/**
 * Convert a THREE.Vector3 to a Position
 *
 * @param vector The vector to convert
 * @returns A Position with the same coordinates
 */
export function vector3ToPosition(vector: THREE.Vector3): Position {
  return { x: vector.x, y: vector.y, z: vector.z };
}

/**
 * Calculate the midpoint between two positions
 *
 * @param a First position
 * @param b Second position
 * @returns The midpoint position
 */
export function midpoint(a: Position, b: Position): Position {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

/**
 * Calculate a position along the line between two positions
 *
 * @param a Start position
 * @param b End position
 * @param t Interpolation factor (0 = at a, 1 = at b)
 * @returns The interpolated position
 */
export function lerp(a: Position, b: Position, t: number): Position {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Calculate the direction vector from one position to another
 *
 * @param from Starting position
 * @param to Ending position
 * @returns The normalized direction vector
 */
export function direction(from: Position, to: Position): Position {
  const dist = distance(from, to);
  if (dist === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: (to.x - from.x) / dist,
    y: (to.y - from.y) / dist,
    z: (to.z - from.z) / dist,
  };
}

/**
 * Calculate the magnitude (length) of a vector
 *
 * @param vector The vector
 * @returns The magnitude of the vector
 */
export function magnitude(vector: Position): number {
  return Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
  );
}

/**
 * Normalize a vector (make its length 1 while preserving direction)
 *
 * @param vector The vector to normalize
 * @returns The normalized vector
 */
export function normalize(vector: Position): Position {
  const mag = magnitude(vector);
  if (mag === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: vector.x / mag,
    y: vector.y / mag,
    z: vector.z / mag,
  };
}

/**
 * Add two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns The sum vector
 */
export function add(a: Position, b: Position): Position {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

/**
 * Subtract vector b from vector a
 *
 * @param a First vector
 * @param b Second vector
 * @returns The difference vector (a - b)
 */
export function subtract(a: Position, b: Position): Position {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

/**
 * Multiply a vector by a scalar
 *
 * @param vector The vector
 * @param scalar The scalar value
 * @returns The scaled vector
 */
export function multiply(vector: Position, scalar: number): Position {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  };
}

/**
 * Calculate the dot product of two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns The dot product
 */
export function dot(a: Position, b: Position): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Calculate the cross product of two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns The cross product vector
 */
export function cross(a: Position, b: Position): Position {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
