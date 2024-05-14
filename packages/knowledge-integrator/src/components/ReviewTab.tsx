import React, { useEffect, useState } from "react";
import { Box, List } from "grommet";
import { RLC_MEMO_TYPE_UID, RLC_MEMO_TITLE_TYPE_UID } from "./RLCConstants";
import { Fact } from "../types";
import { getClassified, getClassificationFact } from "../RLCBaseClient";
// import {
//   CLASSIFIED_ENDPOINT,
//   LH_OBJECT_COMPLETION_ENDPOINT,
//   RH_OBJECT_COMPLETION_ENDPOINT,
// } from "../constants";

const BORDER = false;

const InsertTab: React.FC = () => {
  const [memos, setMemos] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [refObject, setRefObject] = useState<Fact | null>(null);

  const getRLCMemos = async () => {
    const { facts, concepts } = await getClassified(RLC_MEMO_TYPE_UID);
    if (facts.length > 0) {
      return facts;
    } else {
      return [];
    }
  };

  const getRLCMemoParts = async (memoUID: number) => {
    const COMPOSITION_OF_AN_ASPECT = 1262;

    // const response = await axiosInstance.get(LH_OBJECT_COMPLETION_ENDPOINT, {
    //   params: {
    //     rel_type_uid: COMPOSITION_OF_AN_ASPECT,
    //     rh_object_uid: memoUID,
    //   },
    // });
    // if (response.data.length > 0) {
    //   return response.data;
    // } else {
    return [];
    // }
  };

  const getRLCMemoReference = async (memoUID: number) => {
    const REFERENCE_TO_OBJECT_BY_INFORMATION = 1770;

    // const response = await axiosInstance.get(RH_OBJECT_COMPLETION_ENDPOINT, {
    //   params: {
    //     lh_object_uid: memoUID,
    //     rel_type_uid: REFERENCE_TO_OBJECT_BY_INFORMATION,
    //   },
    // });
    // if (response.data.length > 0) {
    //   return response.data;
    // } else {
    return [];
    // }
  };

  useEffect(() => {
    getRLCMemos().then((memos) => {
      setMemos(memos);
    });
  }, []);

  const onMemoTitleClick = async ({
    item,
  }: {
    item?: Fact;
    index?: number;
  }) => {
    if (!item) {
      return;
    }
    const parts = await getRLCMemoParts(item.lh_object_uid);
    if (parts.length < 2) {
      console.log("---");
    } else if (parts.length > 2) {
      console.log("+++");
    } else {
      const classificationFact0 = await getClassificationFact(
        parts[0].lh_object_uid
      );
      const classificationFact1 = await getClassificationFact(
        parts[1].lh_object_uid
      );
      let title = "";
      let body = "";
      if (classificationFact0.rh_object_uid === RLC_MEMO_TITLE_TYPE_UID) {
        title = classificationFact0.full_definition;
        body = classificationFact1.full_definition;
      } else {
        title = classificationFact1.full_definition;
        body = classificationFact0.full_definition;
      }
      setTitle(title);
      setBody(body);
    }

    const references = await getRLCMemoReference(item.lh_object_uid);
    if (references.length > 0) {
      const refFact = await getClassificationFact(references[0].rh_object_uid);
      setRefObject(refFact);
    }
  };

  return (
    <Box direction="row" border={BORDER} gap="medium">
      <Box direction="row" border={BORDER} gap="medium">
        <List
          primaryKey="lh_object_name"
          data={memos}
          onClickItem={onMemoTitleClick}
        />
      </Box>
      <Box direction="column" border={BORDER} gap="medium">
        <Box direction="row" border={BORDER} gap="medium">
          title :{title}
        </Box>
        <Box direction="row" border={BORDER} gap="medium">
          body :{body}
        </Box>
        <Box direction="row" border={BORDER} gap="medium">
          reference object :{refObject?.lh_object_name}
        </Box>
      </Box>
    </Box>
  );
};

export default InsertTab;
