import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Field } from "formik";
import { useStore } from "react-admin";

import { conjureDefinition } from "../../CCClient";

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const BaseDef = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);
  const [anthropicAPIKey, setAnthropicAPIKey] = useStore(
    ANTHROPIC_API_KEY,
    null
  );

  const { values, subject, handleOpen, setFieldValue, supertypeConeUID } =
    props;

  const conjureDef = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const supertype = values["supertype"];
    const preferredName = values[`${subject}Name`];

    if (openAIAPIKey !== null) {
      const completion = await conjureDefinition(
        openAIAPIKey,
        supertype.lh_object_uid,
        preferredName
      );
      setFieldValue(`${subject}Definition`, completion);
    }
  };

  return (
    <>
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
        <Field
          name={`${subject}Definition`}
          type="text"
          as="textarea"
          placeholder="Enter definition here"
          multiLine
          rows={4}
          fullWidth
        />
        <IconButton onClick={() => conjureDef(values, setFieldValue)}>
          <AutoAwesomeIcon />
        </IconButton>
      </label>
    </>
  );
};

export default BaseDef;
