import React, { JSX } from 'react';

interface CacheTypeSelectProps {
  disabled: boolean;
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
}

const CACHE_TYPES = [
  { id: 'entity_facts', label: 'Entity Facts Cache' },
  { id: 'lineage', label: 'Lineage Cache' },
  { id: 'subtypes', label: 'Subtypes Cache' }
];

const CacheTypeSelect = ({
  disabled,
  selectedTypes,
  onSelectionChange
}: CacheTypeSelectProps) => {
  const handleCheckboxChange = (typeId: string) => {
    const newSelection = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Cache Types:</label>
      <div className="space-y-2">
        {CACHE_TYPES.map(({ id, label }) => (
          <label
            key={id}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(id)}
              onChange={() => handleCheckboxChange(id)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CacheTypeSelect;