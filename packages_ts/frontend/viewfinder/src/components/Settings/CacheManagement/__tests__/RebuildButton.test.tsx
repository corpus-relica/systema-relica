import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RebuildButton from '../RebuildButton';

describe('RebuildButton', () => {
  const mockOnRebuild = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default text when not rebuilding', () => {
    render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={false}
      />
    );
    
    expect(screen.getByRole('button')).toHaveTextContent('Rebuild Cache');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders with rebuilding text when rebuilding', () => {
    render(
      <RebuildButton 
        isRebuilding={true} 
        onRebuild={mockOnRebuild}
        disabled={true}
      />
    );
    
    expect(screen.getByRole('button')).toHaveTextContent('Rebuilding...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onRebuild when clicked', () => {
    render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={false}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnRebuild).toHaveBeenCalledTimes(1);
  });

  it('does not call onRebuild when disabled', () => {
    render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnRebuild).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes when rebuilding', () => {
    render(
      <RebuildButton 
        isRebuilding={true} 
        onRebuild={mockOnRebuild}
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies correct CSS classes when enabled', () => {
    render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={false}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('takes a snapshot when not rebuilding', () => {
    const { container } = render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={false}
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot when rebuilding', () => {
    const { container } = render(
      <RebuildButton 
        isRebuilding={true} 
        onRebuild={mockOnRebuild}
        disabled={true}
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot when disabled', () => {
    const { container } = render(
      <RebuildButton 
        isRebuilding={false} 
        onRebuild={mockOnRebuild}
        disabled={true}
      />
    );
    
    expect(container).toMatchSnapshot();
  });
});