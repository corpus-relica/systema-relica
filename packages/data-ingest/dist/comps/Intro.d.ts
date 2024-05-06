import React from 'react';
type Props = {
    next: () => void;
    loadUS: () => void;
    unloadUS: () => void;
    rebuildEFCache: () => void;
    rebuildELCache: () => void;
};
export default function Intro({ next, loadUS, unloadUS, rebuildEFCache, rebuildELCache, }: Props): React.JSX.Element;
export {};
