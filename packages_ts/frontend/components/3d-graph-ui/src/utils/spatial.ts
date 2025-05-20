/**
 * Spatial Utility Functions
 *
 * This file contains utility functions for spatial calculations used in the 3D graph.
 * These functions help with spatial queries, frustum culling, and other spatial operations.
 */

import * as THREE from "three";
import { Position } from "../types.js";
import { positionToVector3, vector3ToPosition } from "./vector.js";

/**
 * Check if a point is inside an axis-aligned bounding box (AABB)
 *
 * @param point The point to check
 * @param min The minimum corner of the AABB
 * @param max The maximum corner of the AABB
 * @returns True if the point is inside the AABB, false otherwise
 */
export function isPointInBox(
  point: Position,
  min: Position,
  max: Position
): boolean {
  return (
    point.x >= min.x &&
    point.x <= max.x &&
    point.y >= min.y &&
    point.y <= max.y &&
    point.z >= min.z &&
    point.z <= max.z
  );
}

/**
 * Check if a point is inside a sphere
 *
 * @param point The point to check
 * @param center The center of the sphere
 * @param radius The radius of the sphere
 * @returns True if the point is inside the sphere, false otherwise
 */
export function isPointInSphere(
  point: Position,
  center: Position,
  radius: number
): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const dz = point.z - center.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  return distanceSquared <= radius * radius;
}

/**
 * Check if a sphere intersects an AABB
 *
 * @param sphereCenter The center of the sphere
 * @param sphereRadius The radius of the sphere
 * @param boxMin The minimum corner of the AABB
 * @param boxMax The maximum corner of the AABB
 * @returns True if the sphere intersects the AABB, false otherwise
 */
export function sphereIntersectsBox(
  sphereCenter: Position,
  sphereRadius: number,
  boxMin: Position,
  boxMax: Position
): boolean {
  // Find the closest point on the box to the sphere center
  const closestX = Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x));
  const closestY = Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y));
  const closestZ = Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z));

  // Calculate squared distance between closest point and sphere center
  const dx = closestX - sphereCenter.x;
  const dy = closestY - sphereCenter.y;
  const dz = closestZ - sphereCenter.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;

  // If the distance is less than the radius squared, they intersect
  return distanceSquared <= sphereRadius * sphereRadius;
}

/**
 * Check if two AABBs intersect
 *
 * @param minA The minimum corner of the first AABB
 * @param maxA The maximum corner of the first AABB
 * @param minB The minimum corner of the second AABB
 * @param maxB The maximum corner of the second AABB
 * @returns True if the AABBs intersect, false otherwise
 */
export function boxIntersectsBox(
  minA: Position,
  maxA: Position,
  minB: Position,
  maxB: Position
): boolean {
  return !(
    maxA.x < minB.x ||
    minA.x > maxB.x ||
    maxA.y < minB.y ||
    minA.y > maxB.y ||
    maxA.z < minB.z ||
    minA.z > maxB.z
  );
}

/**
 * Check if a point is inside the view frustum
 *
 * @param point The point to check
 * @param frustum The view frustum
 * @returns True if the point is inside the frustum, false otherwise
 */
export function isPointInFrustum(
  point: Position,
  frustum: THREE.Frustum
): boolean {
  const vector = positionToVector3(point);
  return frustum.containsPoint(vector);
}

/**
 * Check if a sphere is inside or intersects the view frustum
 *
 * @param center The center of the sphere
 * @param radius The radius of the sphere
 * @param frustum The view frustum
 * @returns True if the sphere is inside or intersects the frustum, false otherwise
 */
export function isSphereInFrustum(
  center: Position,
  radius: number,
  frustum: THREE.Frustum
): boolean {
  const vector = positionToVector3(center);
  return frustum.intersectsSphere(new THREE.Sphere(vector, radius));
}

/**
 * Calculate a frustum from a camera
 *
 * @param camera The camera
 * @returns The view frustum
 */
export function calculateFrustum(camera: THREE.Camera): THREE.Frustum {
  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  // Update the camera's projection matrix if needed
  camera.updateMatrixWorld();

  // Calculate the projection-screen matrix
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );

  // Extract the frustum from the projection-screen matrix
  frustum.setFromProjectionMatrix(projScreenMatrix);

  return frustum;
}

/**
 * Calculate the bounding box of a set of positions
 *
 * @param positions Array of positions
 * @returns Object containing min and max corners of the bounding box
 */
export function calculateBoundingBox(positions: Position[]): {
  min: Position;
  max: Position;
} {
  if (positions.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }

  const min = { ...positions[0] };
  const max = { ...positions[0] };

  for (let i = 1; i < positions.length; i++) {
    const pos = positions[i];
    min.x = Math.min(min.x, pos.x);
    min.y = Math.min(min.y, pos.y);
    min.z = Math.min(min.z, pos.z);
    max.x = Math.max(max.x, pos.x);
    max.y = Math.max(max.y, pos.y);
    max.z = Math.max(max.z, pos.z);
  }

  return { min, max };
}

/**
 * Calculate the center of a bounding box
 *
 * @param min The minimum corner of the bounding box
 * @param max The maximum corner of the bounding box
 * @returns The center position
 */
export function calculateBoxCenter(min: Position, max: Position): Position {
  return {
    x: (min.x + max.x) / 2,
    y: (min.y + max.y) / 2,
    z: (min.z + max.z) / 2,
  };
}

/**
 * Calculate the size of a bounding box
 *
 * @param min The minimum corner of the bounding box
 * @param max The maximum corner of the bounding box
 * @returns The size as a Position (width, height, depth)
 */
export function calculateBoxSize(min: Position, max: Position): Position {
  return {
    x: Math.abs(max.x - min.x),
    y: Math.abs(max.y - min.y),
    z: Math.abs(max.z - min.z),
  };
}

/**
 * Find the nearest point in an array to a given position
 *
 * @param position The reference position
 * @param points Array of positions to search
 * @returns The nearest position and its index, or null if the array is empty
 */
export function findNearestPoint(
  position: Position,
  points: Position[]
): { point: Position; index: number } | null {
  if (points.length === 0) return null;

  let nearestIndex = 0;
  let nearestDistSq = Number.MAX_VALUE;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const dx = point.x - position.x;
    const dy = point.y - position.y;
    const dz = point.z - position.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestIndex = i;
    }
  }

  return {
    point: points[nearestIndex],
    index: nearestIndex,
  };
}

/**
 * Project a 3D position to 2D screen coordinates
 *
 * @param position The 3D position
 * @param camera The camera
 * @param renderer The renderer
 * @returns The 2D screen coordinates (x, y)
 */
export function projectToScreen(
  position: Position,
  camera: THREE.Camera,
  renderer: THREE.Renderer
): { x: number; y: number } {
  const vector = positionToVector3(position);
  const widthHalf = renderer.domElement.width / 2;
  const heightHalf = renderer.domElement.height / 2;

  // Project the 3D position to normalized device coordinates (NDC)
  vector.project(camera);

  // Convert NDC to screen coordinates
  return {
    x: vector.x * widthHalf + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf,
  };
}

/**
 * Unproject 2D screen coordinates to a 3D position
 *
 * @param screenX The x screen coordinate
 * @param screenY The y screen coordinate
 * @param camera The camera
 * @param renderer The renderer
 * @param z The z-depth (default: 0)
 * @returns The 3D position
 */
export function unprojectFromScreen(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  renderer: THREE.Renderer,
  z: number = 0
): Position {
  const vector = new THREE.Vector3();
  const widthHalf = renderer.domElement.width / 2;
  const heightHalf = renderer.domElement.height / 2;

  // Convert screen coordinates to NDC
  vector.set(
    (screenX - widthHalf) / widthHalf,
    -(screenY - heightHalf) / heightHalf,
    z
  );

  // Unproject the NDC to 3D position
  vector.unproject(camera);

  return vector3ToPosition(vector);
}
