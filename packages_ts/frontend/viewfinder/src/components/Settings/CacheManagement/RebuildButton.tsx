import React from 'react';
import { Button } from '../../ui/button.js';

interface RebuildButtonProps {
  isRebuilding: boolean;
  onRebuild: () => void;
  disabled: boolean;
}

const RebuildButton = ({
  isRebuilding,
  onRebuild,
  disabled
}: RebuildButtonProps) => {
  return (
    <Button
      onClick={onRebuild}
      disabled={disabled}
      className="w-full sm:w-auto"
    >
      {isRebuilding ? 'Rebuilding...' : 'Rebuild Cache'}
    </Button>
  );
};

export default RebuildButton;