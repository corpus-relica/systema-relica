import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CacheTypeSelect from '../CacheTypeSelect';
import { mockCacheTypes } from '../../../../tests/setup/cacheMockData';

describe('CacheTypeSelect', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all cache type options', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByLabelText('All Caches')).toBeInTheDocument();
    expect(screen.getByLabelText('Entity Cache')).toBeInTheDocument();
    expect(screen.getByLabelText('Relationship Cache')).toBeInTheDocument();
  });

  it('shows selected cache types as checked', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={['all', 'entity']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByLabelText('All Caches')).toBeChecked();
    expect(screen.getByLabelText('Entity Cache')).toBeChecked();
    expect(screen.getByLabelText('Relationship Cache')).not.toBeChecked();
  });

  it('calls onSelectionChange when checkbox is clicked', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const entityCheckbox = screen.getByLabelText('Entity Cache');
    fireEvent.click(entityCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['entity']);
  });

  it('removes type from selection when unchecked', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={['all', 'entity']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const entityCheckbox = screen.getByLabelText('Entity Cache');
    fireEvent.click(entityCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['all']);
  });

  it('disables all checkboxes when disabled prop is true', () => {
    render(
      <CacheTypeSelect
        disabled={true}
        selectedTypes={['all']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByLabelText('All Caches')).toBeDisabled();
    expect(screen.getByLabelText('Entity Cache')).toBeDisabled();
    expect(screen.getByLabelText('Relationship Cache')).toBeDisabled();
  });

  it('does not call onSelectionChange when disabled', () => {
    render(
      <CacheTypeSelect
        disabled={true}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const entityCheckbox = screen.getByLabelText('Entity Cache');
    fireEvent.click(entityCheckbox);

    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('handles selecting all cache type', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={['entity']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const allCheckbox = screen.getByLabelText('All Caches');
    fireEvent.click(allCheckbox);

    // When 'all' is selected, it should clear other selections
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['all']);
  });

  it('deselects all when individual cache is selected', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={['all']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const entityCheckbox = screen.getByLabelText('Entity Cache');
    fireEvent.click(entityCheckbox);

    // Selecting individual cache should remove 'all'
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['entity']);
  });

  it('displays cache type descriptions', () => {
    render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Rebuild all cache types')).toBeInTheDocument();
    expect(screen.getByText('Rebuild entity cache only')).toBeInTheDocument();
    expect(screen.getByText('Rebuild relationship cache only')).toBeInTheDocument();
  });

  it('applies correct CSS classes when enabled', () => {
    const { container } = render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveClass('h-4', 'w-4', 'text-blue-600');
    });
  });

  it('applies correct CSS classes when disabled', () => {
    const { container } = render(
      <CacheTypeSelect
        disabled={true}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const labels = container.querySelectorAll('label');
    labels.forEach(label => {
      expect(label).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  it('takes a snapshot with no selection', () => {
    const { container } = render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with selections', () => {
    const { container } = render(
      <CacheTypeSelect
        disabled={false}
        selectedTypes={['all', 'entity']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot when disabled', () => {
    const { container } = render(
      <CacheTypeSelect
        disabled={true}
        selectedTypes={['entity']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(container).toMatchSnapshot();
  });
});