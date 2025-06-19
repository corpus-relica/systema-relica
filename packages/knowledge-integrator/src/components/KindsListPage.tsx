import React, { useEffect, useState, useRef } from 'react';
import { Title } from 'react-admin';
import KindsList from './KindsList';

export const KindsListPage: React.FC = () => {
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - rect.top - 40; // 40px for padding
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    // Use ResizeObserver for more precise container size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' ,padding: '20px', boxSizing: 'border-box' }}>
      <Title title="Kinds" />
      <div style={{ 
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      }}>
        <KindsList height={containerHeight} />
      </div>
    </div>
  );
};

export default KindsListPage;
