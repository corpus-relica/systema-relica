import React from "react";
import * as THREE from "three";
import { Torus, Billboard, Text } from "@react-three/drei";

import { TEXT_HIGHLIGHT_COLOR } from "./colors.js";

export interface UnaryLinkProps {
  hovered: boolean;
  pos: [number, number, number];
  linksLength: number;
  idx: number;
  id: number;
  offset: number;
  label: string;
  color: string;
}

const radius = 2;

const UnaryLink: React.FC<UnaryLinkProps> = ({
  offset,
  id,
  idx,
  pos,
  linksLength,
  hovered,
  label,
  color,
}) => {
  // const color = hovered ? 0xff0000 : 0x00ff00;
  const curve = new THREE.EllipseCurve(
    -2.35,
    0, // ax, aY
    radius,
    radius, // xRadius, yRadius
    0.08 * (2 * Math.PI),
    0.92 * (2 * Math.PI), // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  const points = curve.getPoints(16);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: color });
  // Create geometry and material for visualization purposes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ellipse = new THREE.Line(geometry, material);

  // Create geometries and materials for the torus
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const geom = new THREE.TorusGeometry(2, 0.5, 12, 48, Math.PI * 2 * 0.84);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const geom2 = new THREE.TorusGeometry(2, 0.05, 12, 48, Math.PI * 2 * 0.8);
  const mat2 = new THREE.MeshBasicMaterial({ color: color });

  const userData = { uid: id, type: "link" };

  // Calculate position for the billboard
  // Calculate rotation and translation
  const axis = new THREE.Vector3(0, 1, 0); // Assuming rotation around Y axis
  const angle = 2 * Math.PI * ((idx + 1) / linksLength + offset);
  const initialPosition = new THREE.Vector3(-4.35, 0.53, 0);
  //pos[0], pos[1], pos[2]
  initialPosition.applyAxisAngle(axis, angle);
  initialPosition.x += pos[0]; // Example translation, adjust axis and distance as needed
  initialPosition.y += pos[1];
  initialPosition.z += pos[2];

  // Use the calculated position for the Billboard component
  const billboardPos: [number, number, number] = [
    initialPosition.x,
    initialPosition.y,
    initialPosition.z,
  ];

  return (
    // @ts-expect-error - Fragment props are not fully typed
    <>
      {/* @ts-expect-error - group props are not fully typed */}
      <group
        userData={userData}
        rotation={[0, 2 * Math.PI * ((idx + 1) / linksLength + offset), 0]}
        position={pos}
      >
        <Torus
          userData={userData}
          material={mat}
          rotation={[0, 0, Math.PI * 2 * 0.08]}
          // rotation={rotation as any}
          position={[-2.35, 0.55, 0]}
          // position={pos}
          args={[2, 0.5, 12, 48, Math.PI * 2 * 0.84]}
          visible={false}
        />
        {/*<primitive
          userData={userData}
          object={torus}
          position={[-2.35, 0, 0]}
          rotation={[0, 0, Math.PI * 2 * 0.08]}
          visible={true}
        />
        // <primitive
        //   userData={userData}
        //   object={torus2}
        //   position={[-2.35, 0.55, 0]}
        //   rotation={[0, 0, Math.PI * 2 * 0.08]}
        //   visible={true}
        // />*/}
        <Torus
          userData={userData}
          material={mat2}
          rotation={[0, 0, Math.PI * 2 * 0.08]}
          // rotation={rotation as any}
          position={[-2.35, 0.55, 0]}
          // position={pos}
          args={[2, 0.05, 12, 48, Math.PI * 2 * 0.8]}
        />

        {/* @ts-expect-error - mesh props are not fully typed */}
        <mesh
          userData={userData}
          position={[-0.7, 1.65, 0]}
          rotation={[0, 0, 0.61 * (Math.PI * 2)]}
        >
          {/* @ts-expect-error - coneGeometry props are not fully typed */}
          <coneGeometry args={[0.2, 1, 4]} />
          {/* @ts-expect-error - meshBasicMaterial props are not fully typed */}
          <meshBasicMaterial color={color} />
          {/* @ts-expect-error - closing tag is not properly typed */}
        </mesh>

        {/* @ts-expect-error - closing tag is not properly typed */}
      </group>

      {hovered && (
        <Billboard
          position={billboardPos}
          rotation={[0, 2 * Math.PI * ((idx + 1) / linksLength + offset), 0]}
          follow
        >
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
    </>
  );
};

export default UnaryLink;
