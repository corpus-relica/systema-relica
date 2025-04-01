# Quintessential Model Visualization

A React component for visualizing Quintessential Models in 3D space using Three.js and React Three Fiber.

## Overview

This component provides an interactive 3D visualization of quintessential models, displaying the elements and their relationships in a spatial layout. It's designed to integrate seamlessly with the Relica Knowledge Integrator.

## Features

- 3D spherical layout for model elements
- Interactive node selection
- Visualization of supertype relationships
- Color-coding based on element category or nature
- Support for detailed information display when elements are selected

## Usage

```tsx
import { QuintessentialModelViz } from '@relica/quintessential-model-viz';

// Sample model data
const modelData = {
  models: [
    {
      uid: 990007,
      name: "man",
      nature: "kind",
      category: "physical object",
      definitions: ["is a person who is male."],
      supertypes: [990010],
      // other properties...
    },
    // other model elements...
  ]
};

const MyComponent = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  
  const handleElementClick = (element) => {
    setSelectedElement(element);
    // Additional actions when an element is clicked
  };
  
  return (
    <QuintessentialModelViz
      model={modelData}
      onElementClick={handleElementClick}
      selectedElement={selectedElement?.uid?.toString()}
    />
  );
}
```

## Integration with Knowledge Integrator

The component is designed to be integrated with the Knowledge Integrator interface, providing an alternative view to the standard graph visualization. Users can toggle between the standard graph view and the quintessential model view using the switch in the top-left corner of the Graph page.

## Development

### Prerequisites

- Node.js
- Yarn

### Setup

```bash
cd packages_ts/frontend/components/quintessential-model-viz
yarn install
```

### Development Server

```bash
yarn dev
```

### Build

```bash
yarn build
```

## License

Internal use only - Corpus Relica