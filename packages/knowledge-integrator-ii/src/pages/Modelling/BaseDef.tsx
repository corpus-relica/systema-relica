import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Field } from "formik";

const BaseDef = (props: any) => {
  const { subject, handleOpen, setFieldValue, supertypeConeUID } = props;

  return (
    <div>
      <h1>BaseDef</h1>
      <label>
        supertype
        <Field name="supertype.lh_object_uid" type="text" />
        <Field name="supertype.lh_object_name" type="text" />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen("supertype", setFieldValue, supertypeConeUID); // "790229 - Role"
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
      <br />
      <label>
        new {subject} name
        <Field name={`${subject}Name`} type="" />
      </label>
      <br />
      <label>
        {subject} definition
        <Field name={`${subject}Definition`} type="text" />
      </label>
    </div>
  );
};

export default BaseDef;
