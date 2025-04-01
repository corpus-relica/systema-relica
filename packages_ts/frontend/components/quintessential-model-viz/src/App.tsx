import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as drei from '@react-three/drei';
import './App.css';
import { ModelRenderer } from './ModelRenderer';
import { QuintessentialModel, ModelElement } from './types';

interface QuintessentialModelVizProps {
  model: QuintessentialModel;
  onElementClick?: (element: ModelElement) => void;
  selectedElement?: string;
}

// Using only named export to avoid the named and default export warning
export const QuintessentialModelViz: React.FC<QuintessentialModelVizProps> = ({
  model,
  onElementClick,
  selectedElement
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (model) {
      setIsReady(true);
    }
  }, [model]);

  return (
    <div className="quintessential-model-container" style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        {/* @ts-ignore */}
        <ambientLight intensity={0.5} />
        {/* @ts-ignore */}
        <pointLight position={[10, 10, 10]} />
        <drei.OrbitControls />
        {isReady && (
          <ModelRenderer 
            model={model} 
            onElementClick={onElementClick}
            selectedElement={selectedElement}
          />
        )}
      </Canvas>
    </div>
  );
};