import React, { useState } from "react";
// @ts-ignore
import * as THREE from "three";
import { Billboard, Text, Line } from "@react-three/drei";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import { Position } from "./types";

import {
  TEXT_HIGHLIGHT_COLOR,
  TEXT_DEFAULT_COLOR,
  TEXT_ULTIMATE_HIGHLIGHT_COLOR,
} from "./colors";

export interface LinkProps {
  id: number;
  label: string;
  type: number;
  source: Position;
  target: Position;
  baseColor: string;
  hovered: boolean;
}

const lineOffsetLength = 1.618; // Length by which to shorten the line on each end
const cylinderOffsetLength = 1.618; // Length by which to shorten the cylinder on each end

const radius = 2; // You can control the radius here
const tubeRadius = 0.1; // Radius of the tube
const radialSegments = 8; // Number of segments in the tube
const tubularSegments = 8; // Number of segments along the curve

interface LoopLinkProps {
  origin: Position;
}

const LoopLink: React.FC<LoopLinkProps> = observer(
  ({ origin }: LoopLinkProps) => {
    console.log("EVEN HYEPPENING????");
    // Create an ellipse curve
    // Create an ellipse curve

    const curve = new THREE.EllipseCurve(
      origin.x,
      origin.y, // ax, aY
      radius,
      radius, // xRadius, yRadius
      0,
      1.5 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0, // aRotation
    );

    // Convert it to a set of points
    const points = curve.getPoints(32);
    return <Line points={points} color="white" />;
  },
);

const Link: React.FC<LinkProps> = observer(
  ({ id, type, label, source, target, baseColor, hovered }: LinkProps) => {
    if (
      source.x === target.x &&
      source.y === target.y &&
      source.z === target.z
    ) {
      return (
        <LoopLink
          {...{
            origin: source,
          }}
        />
      );
    }
    const sourceVector = new THREE.Vector3(source.x, source.y, source.z);
    const targetVector = new THREE.Vector3(target.x, target.y, target.z);

    const midPoint = new THREE.Vector3()
      .addVectors(sourceVector, targetVector)
      .multiplyScalar(0.5);

    const cylinderDirection = new THREE.Vector3()
      .subVectors(targetVector, sourceVector)
      .normalize();

    const orientation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      cylinderDirection,
    );

    const offsetVector = cylinderDirection.clone().multiplyScalar(-1); // Reverse the direction
    const conePosition = new THREE.Vector3().addVectors(
      targetVector,
      offsetVector.multiplyScalar(lineOffsetLength),
    );

    const lineStartVector = new THREE.Vector3().addVectors(
      sourceVector,
      cylinderDirection.clone().multiplyScalar(lineOffsetLength),
    );
    const lineEndVector = new THREE.Vector3().addVectors(
      targetVector,
      cylinderDirection.clone().multiplyScalar(-lineOffsetLength),
    );
    const cylinderStartVector = new THREE.Vector3().addVectors(
      sourceVector,
      cylinderDirection.clone().multiplyScalar(cylinderOffsetLength),
    );
    const cylinderEndVector = new THREE.Vector3().addVectors(
      targetVector,
      cylinderDirection.clone().multiplyScalar(-cylinderOffsetLength),
    );
    const cylinderLength = cylinderStartVector.distanceTo(cylinderEndVector);
    const lineLength = lineStartVector.distanceTo(lineEndVector);

    const color: string = hovered ? "hotpink" : baseColor;

    //Handle self reference

    const points = [];
    points.push(lineStartVector);
    points.push(lineEndVector);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const userData = { uid: id, type: "link" };

    return (
      <>
        <mesh
          userData={userData}
          position={midPoint}
          quaternion={orientation}
          visible={true}
        >
          <cylinderGeometry args={[0.05, 0.05, lineLength, 3]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh
          userData={userData}
          position={midPoint}
          quaternion={orientation}
          visible={false}
        >
          <cylinderGeometry args={[0.5, 0.5, cylinderLength, 5]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {hovered && (
          <Billboard position={midPoint} follow>
            <Text
              userData={userData}
              fontSize={0.75}
              color={TEXT_HIGHLIGHT_COLOR}
              anchorX="center"
              anchorY="middle"
              position={new THREE.Vector3(0, 0, 1)}
            >
              {label}
            </Text>
          </Billboard>
        )}
        <mesh
          userData={userData}
          position={conePosition}
          quaternion={orientation}
        >
          <coneGeometry args={[0.2, 1, 4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </>
    );
  },
);

export default Link;
