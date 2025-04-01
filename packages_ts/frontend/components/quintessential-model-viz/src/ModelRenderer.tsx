import React, { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as drei from '@react-three/drei';
import * as THREE from 'three';
import { QuintessentialModel, ModelElement, ModelGraph, ElementNode, ElementLink, Position } from './types';
import { getElementColor } from './utils';

interface ModelNode {
  id: string;
  element: ModelElement;
  position: THREE.Vector3;
  color: string;
  size: number;
}

interface ModelLink {
  id: string;
  source: string;
  target: string;
  type: string;
  color: string;
  sourcePos: THREE.Vector3;
  targetPos: THREE.Vector3;
}

interface ModelRendererProps {
  model: QuintessentialModel;
  onElementClick?: (element: ModelElement) => void;
  selectedElement?: string;
}

// Helper function to generate 3D positions for nodes in a spherical layout
const generateSphericalLayout = (elements: ModelElement[], radius: number = 10): Record<string, Position> => {
  const positions: Record<string, Position> = {};
  const phi = Math.PI * (3. - Math.sqrt(5.)); // Golden angle
  
  elements.forEach((element, i) => {
    const y = 1 - (i / (elements.length - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y) * radius; // radius at y position
    
    const theta = phi * i; // Golden angle increment
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    positions[element.uid.toString()] = { x, y: y * radius, z };
  });
  
  return positions;
};

export const ModelRenderer: React.FC<ModelRendererProps> = ({ 
  model, 
  onElementClick,
  selectedElement 
}) => {
  const { camera } = useThree();
  const [graph, setGraph] = useState<{ nodes: ModelNode[], links: ModelLink[] }>({ nodes: [], links: [] });
  
  // Process the model data to create a 3D graph
  useEffect(() => {
    if (!model || !model.models || model.models.length === 0) return;
    
    // Generate positions for each node
    const positions = generateSphericalLayout(model.models);
    
    // Create nodes
    const nodes: ModelNode[] = model.models.map(element => {
      const uid = element.uid.toString();
      const pos = positions[uid] || { x: 0, y: 0, z: 0 };
      
      return {
        id: uid,
        element,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        color: getElementColor(element),
        size: element.nature === 'kind' ? 1 : 0.7
      };
    });
    
    // Create links for supertypes
    const links: ModelLink[] = [];
    model.models.forEach(element => {
      if (element.supertypes && element.supertypes.length > 0) {
        element.supertypes.forEach(supertypeId => {
          const sourcePos = positions[element.uid.toString()] || { x: 0, y: 0, z: 0 };
          const targetPos = positions[supertypeId.toString()] || { x: 0, y: 0, z: 0 };
          
          links.push({
            id: `${element.uid}-${supertypeId}`,
            source: element.uid.toString(),
            target: supertypeId.toString(),
            type: 'supertype',
            color: '#888888',
            sourcePos: new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
            targetPos: new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
          });
        });
      }
    });
    
    setGraph({ nodes, links });
  }, [model]);
  
  return (
    <group>
      {/* Render links */}
      {graph.links.map(link => (
        <group key={link.id}>
          <line>
            <bufferGeometry attach="geometry" 
              onUpdate={self => {
                const points = [link.sourcePos, link.targetPos];
                self.setFromPoints(points);
              }} 
            />
            <lineBasicMaterial attach="material" color={link.color} linewidth={1} />
          </line>
        </group>
      ))}
      
      {/* Render nodes */}
      {graph.nodes.map(node => (
        <group key={node.id} position={[node.position.x, node.position.y, node.position.z]}>
          <mesh 
            onClick={() => onElementClick && onElementClick(node.element)}
            scale={selectedElement === node.id ? [1.3, 1.3, 1.3] : [1, 1, 1]}
          >
            <sphereGeometry args={[node.size, 32, 32]} />
            <meshStandardMaterial 
              color={node.color} 
              emissive={selectedElement === node.id ? node.color : '#000000'} 
              emissiveIntensity={selectedElement === node.id ? 0.5 : 0}
            />
          </mesh>
          <drei.Text
            position={[0, node.size + 0.3, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {node.element.name}
          </drei.Text>
        </group>
      ))}
    </group>
  );
};