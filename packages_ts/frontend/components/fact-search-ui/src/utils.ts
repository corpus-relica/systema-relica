import { useState, useEffect } from "react";
//@ts-ignore
import { debounce } from "lodash";

export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = debounce(() => setDebouncedValue(value), delay);

    // Call the debounce function
    handler();

    // Cancel the debounce on useEffect cleanup.
    return () => handler.cancel();
  }, [value, delay]);

  return debouncedValue;
};
