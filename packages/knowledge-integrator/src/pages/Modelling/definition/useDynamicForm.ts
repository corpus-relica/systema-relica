// Enhanced hook for nested modules
import { useCallback, useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";

const useDynamicForm = (path: string) => {
  const { values, setFieldValue, errors, touched, setFieldError } =
    useFormikContext<any>();
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});

  const getValue = (fieldName: string) => {
    const fullPath = `${path}.${fieldName}`.split(".");
    return fullPath.reduce((acc, part) => acc?.[part], values);
  };

  const setValue = (fieldName: string, value: any) => {
    setFieldValue(`${path}.${fieldName}`, value);
  };

  const getError = (fieldName: string) => {
    console.log("errors", "fieldName", path, fieldName);
    console.log("errors", errors);

    const fullPath: string[] = `${path}.${fieldName}`.split(".");
    const formikError = fullPath.reduce(
      (acc: Record<string, any>, part: string) => acc?.[part],
      errors
    );

    return localErrors[fieldName] || formikError;
  };

  const getTouched = (fieldName: string) => {
    const fullPath: string[] = `${path}.${fieldName}`.split(".");

    const value: any = fullPath.reduce(
      (acc: Record<string, any>, part: string) => acc?.[part],
      touched
    );

    return value;
  };

  const setError = useCallback(
    (fieldName: string, error: string | undefined) => {
      setLocalErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    []
  );

  useEffect(() => {
    // Propagate local errors to Formik
    Object.entries(localErrors).forEach(([fieldName, error]) => {
      if (error) {
        setFieldError(`${path}.${fieldName}`, error);
      }
    });
  }, [localErrors, path, setFieldError]);

  return { getValue, setValue, getError, getTouched, setError };
};

export default useDynamicForm;
