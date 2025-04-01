import React from 'react';
import ReactDOM from 'react-dom/client';
import { QuintessentialModelViz } from './App';
import './App.css';

// Sample model data for development preview
const sampleModel = {
  models: [
    {
      uid: 1,
      name: "Person",
      nature: "kind",
      category: "core",
      supertypes: [],
      description: "A human individual"
    },
    {
      uid: 2,
      name: "Employee",
      nature: "kind",
      category: "organizational",
      supertypes: [1],
      description: "A person employed by an organization"
    },
    {
      uid: 3,
      name: "Customer",
      nature: "role",
      category: "business",
      supertypes: [1],
      description: "A person who purchases goods or services"
    },
    {
      uid: 4,
      name: "Manager",
      nature: "role",
      category: "organizational",
      supertypes: [2],
      description: "An employee who supervises other employees"
    },
    {
      uid: 5,
      name: "Organization",
      nature: "kind",
      category: "core",
      supertypes: [],
      description: "A structured group of people"
    }
  ]
};

const DevelopmentPreview = () => {
  const [selectedElement, setSelectedElement] = React.useState<string | undefined>(undefined);

  const handleElementClick = (element: any) => {
    console.log("Element clicked:", element);
    setSelectedElement(element.uid.toString());
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1 style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, margin: '1rem', color: 'white' }}>
        Quintessential Model Visualization (Dev Preview)
      </h1>
      
      {selectedElement && (
        <div style={{ 
          position: 'absolute', 
          top: '4rem', 
          left: 0, 
          zIndex: 10, 
          margin: '1rem', 
          padding: '1rem',
          background: 'rgba(0,0,0,0.7)', 
          color: 'white',
          borderRadius: '0.5rem',
          maxWidth: '300px'
        }}>
          <h3>Selected: {sampleModel.models.find(m => m.uid.toString() === selectedElement)?.name}</h3>
          <p>{sampleModel.models.find(m => m.uid.toString() === selectedElement)?.description}</p>
        </div>
      )}
      
      <QuintessentialModelViz 
        model={sampleModel}
        onElementClick={handleElementClick}
        selectedElement={selectedElement}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevelopmentPreview />
  </React.StrictMode>,
);
