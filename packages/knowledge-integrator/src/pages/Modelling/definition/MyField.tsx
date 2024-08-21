import React from "react";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

import { TextField, TextFieldProps } from "@mui/material";

const MyField = (props: any) => {
  // const {
  //     values: { textA, textB },
  //     touched,
  //     setFieldValue,
  // } = useFormikContext();
  const [field, meta] = useField(props);

  // React.useEffect(() => {
  //     // set the value of textC, based on textA and textB
  //     if (
  //         textA.trim() !== "" &&
  //         textB.trim() !== "" &&
  //         touched.textA &&
  //         touched.textB
  //     ) {
  //         setFieldValue(props.name, `textA: ${textA}, textB: ${textB}`);
  //     }
  // }, [textB, textA, touched.textA, touched.textB, setFieldValue, props.name]);

  return (
    <>
      <Field {...props} {...field} value={field.value || ""} />
      {/*!!meta.touched && !!meta.error && <div>{meta.error}</div>*/}
    </>
  );
};

// interface MyFieldProps extends Omit<TextFieldProps, "name"> {
//   name: string;
// }

// const MyField: React.FC<MyFieldProps> = ({ name, ...props }) => {
//   const [field, meta] = useField(name);

//   const configTextField: TextFieldProps = {
//     ...props,
//     ...field,
//     fullWidth: true,
//     variant: "outlined",
//     error: meta.touched && Boolean(meta.error),
//     helperText: meta.touched && meta.error,
//     value: field.value ?? "", // Ensure value is always defined
//   };

//   return <TextField {...configTextField} />;
// };

export default MyField;
