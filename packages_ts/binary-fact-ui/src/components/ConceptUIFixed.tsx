import React, { useEffect, useState } from "react";
import { getSpecFact, getSynFacts } from "../axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { Select } from "grommet";
//@ts-ignore
import { Fact } from "@relica/types";

interface ConceptUIFixedProps {
  config: {
    uid: number;
  };
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

const ConceptUIFixed = ({ config, onChange }: ConceptUIFixedProps) => {
  const { uid } = config;
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["specFact", uid],
    queryFn: () => getSpecFact(uid),
  });

  const {
    isLoading: synIsLoading,
    isError: synIsError,
    data: synData,
    error: synError,
  } = useQuery({
    queryKey: ["synonyms", uid],
    queryFn: () => getSynFacts(uid),
  });

  useEffect(() => {
    if (data) {
      console.log("data", data);
      setName(data.lh_object_name);
      setDisplayName(data.lh_object_name);
      if (onChange)
        onChange({ uid: data.lh_object_uid, name: data.lh_object_name });
    }
  }, [data]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const name = event.target.value;
    setDisplayName(name);
    if (onChange) onChange({ uid: uid, name: name });
  };

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error foo: {error.message}</span>;
  }

  let xxx;
  if (synData.length > 0) {
    const nameList = synData.map((fact: Fact) => fact.lh_object_name);
    xxx = (
      <Select
        options={[name, ...nameList]}
        value={displayName}
        onChange={handleSelectChange}
      />
    );
  } else {
    xxx = name;
  }
  return (
    <div>
      <div>
        {uid} : {xxx}
      </div>
    </div>
  );
};

export default ConceptUIFixed;
