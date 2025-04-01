import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import './App.css';
import { ModelRenderer } from './ModelRenderer';
import { QuintessentialModel, ModelElement } from './types';

interface QuintessentialModelVizProps {
  model: QuintessentialModel;
  onElementClick?: (element: ModelElement) => void;
  selectedElement?: string;
}

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
    <div className="quintessential-model-container">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
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

// Default export for the component
export default QuintessentialModelViz;