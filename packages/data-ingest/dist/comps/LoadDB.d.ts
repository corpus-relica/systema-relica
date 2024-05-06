import React from 'react';
type Props = {
    next: () => void;
    selectedFiles: string[];
};
declare const LoadDB: ({ next, selectedFiles }: Props) => React.JSX.Element;
export default LoadDB;
