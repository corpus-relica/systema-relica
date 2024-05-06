import React from 'react';
type Props = {
    next: () => void;
    files: string[];
    setSelectedFiles: (files: string[]) => void;
};
declare const SelectFiles: ({ files, next, setSelectedFiles }: Props) => React.JSX.Element;
export default SelectFiles;
