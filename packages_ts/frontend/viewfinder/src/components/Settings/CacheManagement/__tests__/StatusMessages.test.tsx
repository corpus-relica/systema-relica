import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusMessages from '../StatusMessages';

describe('StatusMessages', () => {
  it('renders nothing when no error or message', () => {
    const { container } = render(
      <StatusMessages error={null} message="" />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when error is provided', () => {
    render(
      <StatusMessages 
        error="Database connection failed" 
        message="" 
      />
    );
    
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    expect(screen.getByText('Error:')).toBeInTheDocument();
  });

  it('renders success message when message is provided', () => {
    render(
      <StatusMessages 
        error={null} 
        message="Cache rebuild completed successfully" 
      />
    );
    
    expect(screen.getByText('Cache rebuild completed successfully')).toBeInTheDocument();
    expect(screen.getByText('Success:')).toBeInTheDocument();
  });

  it('prioritizes error over success message', () => {
    render(
      <StatusMessages 
        error="Something went wrong" 
        message="This should not be shown" 
      />
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('This should not be shown')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for error message', () => {
    render(
      <StatusMessages 
        error="Test error" 
        message="" 
      />
    );
    
    const errorContainer = screen.getByText('Test error').parentElement;
    expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('applies correct CSS classes for success message', () => {
    render(
      <StatusMessages 
        error={null} 
        message="Test success" 
      />
    );
    
    const successContainer = screen.getByText('Test success').parentElement;
    expect(successContainer).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('handles long error messages', () => {
    const longError = 'This is a very long error message that might wrap to multiple lines and should still be displayed correctly within the component boundaries';
    
    render(
      <StatusMessages 
        error={longError} 
        message="" 
      />
    );
    
    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it('handles special characters in messages', () => {
    const specialMessage = 'Cache rebuild failed: <script>alert("test")</script> & other issues';
    
    render(
      <StatusMessages 
        error={specialMessage} 
        message="" 
      />
    );
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('takes a snapshot of error state', () => {
    const { container } = render(
      <StatusMessages 
        error="Cache rebuild failed due to insufficient permissions" 
        message="" 
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot of success state', () => {
    const { container } = render(
      <StatusMessages 
        error={null} 
        message="Cache rebuild completed in 2 minutes 30 seconds" 
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('renders different error types correctly', () => {
    const errorTypes = [
      'Network error: Unable to connect to server',
      'Permission denied: Admin access required',
      'Timeout: Operation took too long',
      'Database error: Connection pool exhausted'
    ];
    
    errorTypes.forEach(error => {
      const { rerender } = render(
        <StatusMessages error={error} message="" />
      );
      
      expect(screen.getByText(error)).toBeInTheDocument();
      
      rerender(<StatusMessages error={null} message="" />);
    });
  });

  it('renders different success messages correctly', () => {
    const successMessages = [
      'Cache rebuild initiated',
      'Processing 1000 entities',
      'Updating relationships',
      'Cache rebuild completed successfully'
    ];
    
    successMessages.forEach(message => {
      const { rerender } = render(
        <StatusMessages error={null} message={message} />
      );
      
      expect(screen.getByText(message)).toBeInTheDocument();
      
      rerender(<StatusMessages error={null} message="" />);
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <StatusMessages 
        error="Test error message" 
        message="" 
      />
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});