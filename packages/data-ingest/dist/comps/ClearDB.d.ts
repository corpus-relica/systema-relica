import React from 'react';
type Props = {
    next: () => void;
    selectedDBClearOption: string;
};
declare const ClearDB: ({ next, selectedDBClearOption }: Props) => React.JSX.Element;
export default ClearDB;
