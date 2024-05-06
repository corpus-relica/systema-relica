import React from 'react';
type Props = {
    next: () => void;
    back: () => void;
    setSelectedDBClearOption: (selectedDBClearOption: string) => void;
};
export default function SelectDBClearOptions({ next, back, setSelectedDBClearOption, }: Props): React.JSX.Element;
export {};
