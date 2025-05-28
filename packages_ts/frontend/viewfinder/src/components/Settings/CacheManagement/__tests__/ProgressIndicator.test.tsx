import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressIndicator from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders progress bar with correct percentage', () => {
    render(<ProgressIndicator progress={45} phase="Processing entities" />);
    
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Processing entities')).toBeInTheDocument();
  });

  it('renders progress bar at 0%', () => {
    render(<ProgressIndicator progress={0} phase="Initializing" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Initializing')).toBeInTheDocument();
  });

  it('renders progress bar at 100%', () => {
    render(<ProgressIndicator progress={100} phase="Completed" />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders progress bar with correct width style', () => {
    const { container } = render(<ProgressIndicator progress={75} phase="Updating cache" />);
    
    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('handles edge case of negative progress', () => {
    render(<ProgressIndicator progress={-10} phase="Error state" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles edge case of progress over 100', () => {
    render(<ProgressIndicator progress={150} phase="Overflow" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders with proper accessibility attributes', () => {
    render(<ProgressIndicator progress={50} phase="Processing" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-label', 'Cache rebuild progress');
  });

  it('displays phase text correctly', () => {
    const phases = [
      'Initializing cache rebuild',
      'Processing entity cache',
      'Processing relationship cache',
      'Finalizing updates',
      'Completed successfully'
    ];
    
    phases.forEach(phase => {
      const { rerender } = render(<ProgressIndicator progress={50} phase={phase} />);
      expect(screen.getByText(phase)).toBeInTheDocument();
      rerender(<ProgressIndicator progress={50} phase="" />);
    });
  });

  it('takes a snapshot at different progress levels', () => {
    const progressLevels = [0, 25, 50, 75, 100];
    
    progressLevels.forEach(progress => {
      const { container } = render(
        <ProgressIndicator 
          progress={progress} 
          phase={`Processing at ${progress}%`} 
        />
      );
      expect(container).toMatchSnapshot(`progress-${progress}`);
    });
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(<ProgressIndicator progress={60} phase="Processing" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-full');
    
    const progressContainer = container.querySelector('.bg-gray-200');
    expect(progressContainer).toHaveClass('rounded-full', 'h-2.5');
    
    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toHaveClass('h-2.5', 'rounded-full', 'transition-all', 'duration-300');
  });

  it('renders empty phase gracefully', () => {
    render(<ProgressIndicator progress={30} phase="" />);
    
    expect(screen.getByText('30%')).toBeInTheDocument();
    // Should not throw error with empty phase
  });
});