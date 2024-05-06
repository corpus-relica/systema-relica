import React from 'react';
type Props = {
    next: () => void;
    selectedFiles: string[];
};
declare const PreprocessData: ({ next, selectedFiles }: Props) => React.JSX.Element;
export default PreprocessData;
