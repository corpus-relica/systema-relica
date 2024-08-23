import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Field } from "formik";

const KGEntityField = (props) => {
  const { name, label, handleOpen, setFieldValue, searchConeUID } = props;

  return (
    <Grid xs={12}>
      <Grid xs={12}>{label}</Grid>
      <Grid xs={12}>
        <Field
          name={`${name}.lh_object_uid`}
          type="text"
          onClick={() => {
            handleOpen(`${name}`, setFieldValue, searchConeUID); // "790229 - Role"
          }}
        />
        <Field name={`${name}.lh_object_name`} type="text" />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(`${name}`, setFieldValue, searchConeUID); // "790229 - Role"
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default KGEntityField;
