import React from "react";
import * as THREE from "three";
import { Billboard, Text, Line } from "@react-three/drei";
import { observer } from "mobx-react";
import { Position } from "../types.js";

import { TEXT_HIGHLIGHT_COLOR } from "../colors.js";

export interface EdgeProps {
  id: number;
  label: string;
  type: number;
  source: Position;
  target: Position;
  baseColor: string;
  hovered: boolean;
  selected: boolean;
}

const lineOffsetLength = 1.618; // Length by which to shorten the line on each end
const cylinderOffsetLength = 1.618; // Length by which to shorten the cylinder on each end
const radius = 2; // You can control the radius here

interface LoopEdgeProps {
  origin: Position;
}

const LoopEdge: React.FC<LoopEdgeProps> = observer(
  ({ origin }: LoopEdgeProps) => {
    // Create an ellipse curve
    const curve = new THREE.EllipseCurve(
      origin.x,
      origin.y, // ax, aY
      radius,
      radius, // xRadius, yRadius
      0,
      1.5 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    // Convert it to a set of points
    const points = curve.getPoints(32);
    return <Line points={points} color="white" />;
  }
);

const Edge: React.FC<EdgeProps> = observer(
  ({
    id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type,
    label,
    source,
    target,
    baseColor,
    hovered,
    selected,
  }: EdgeProps) => {
    if (
      source.x === target.x &&
      source.y === target.y &&
      source.z === target.z
    ) {
      return (
        <LoopEdge
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
      cylinderDirection
    );

    const offsetVector = cylinderDirection.clone().multiplyScalar(-1); // Reverse the direction
    const conePosition = new THREE.Vector3().addVectors(
      targetVector,
      offsetVector.multiplyScalar(lineOffsetLength)
    );

    const lineStartVector = new THREE.Vector3().addVectors(
      sourceVector,
      cylinderDirection.clone().multiplyScalar(lineOffsetLength)
    );
    const lineEndVector = new THREE.Vector3().addVectors(
      targetVector,
      cylinderDirection.clone().multiplyScalar(-lineOffsetLength)
    );
    const cylinderStartVector = new THREE.Vector3().addVectors(
      sourceVector,
      cylinderDirection.clone().multiplyScalar(cylinderOffsetLength)
    );
    const cylinderEndVector = new THREE.Vector3().addVectors(
      targetVector,
      cylinderDirection.clone().multiplyScalar(-cylinderOffsetLength)
    );
    const cylinderLength = cylinderStartVector.distanceTo(cylinderEndVector);
    const lineLength = lineStartVector.distanceTo(lineEndVector);

    const color: string = hovered || selected ? "hotpink" : baseColor;
    const cylinderWidth = selected ? 0.125 : 0.05;

    const points = [];
    points.push(lineStartVector);
    points.push(lineEndVector);

    // Create geometry for visualization purposes only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const userData = { uid: id, type: "link" };

    return (
      <>
        {/* @ts-expect-error - mesh props are not fully typed */}
        <mesh
          userData={userData}
          position={midPoint}
          quaternion={orientation}
          visible={true}
        >
          {/* @ts-expect-error - cylinderGeometry props are not fully typed */}
          <cylinderGeometry
            args={[cylinderWidth, cylinderWidth, lineLength, 3]}
          />
          {/* @ts-expect-error - meshBasicMaterial props are not fully typed */}
          <meshBasicMaterial color={color} />
        </mesh>
        {/* @ts-expect-error - mesh props are not fully typed */}
        <mesh
          userData={userData}
          position={midPoint}
          quaternion={orientation}
          visible={false}
        >
          {/* @ts-expect-error - cylinderGeometry props are not fully typed */}
          <cylinderGeometry args={[0.5, 0.5, cylinderLength, 5]} />
          {/* @ts-expect-error - meshBasicMaterial props are not fully typed */}
          <meshBasicMaterial color={color} />
        </mesh>
        {(hovered || selected) && (
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
        {/* @ts-expect-error - mesh props are not fully typed */}
        <mesh
          userData={userData}
          position={conePosition}
          quaternion={orientation}
        >
          {/* @ts-expect-error - coneGeometry props are not fully typed */}
          <coneGeometry args={[0.2, 1, 4]} />
          {/* @ts-expect-error - meshBasicMaterial props are not fully typed */}
          <meshBasicMaterial color={color} />
        </mesh>
      </>
    );
  }
);

export default Edge;
