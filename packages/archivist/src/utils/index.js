import neo4j from "neo4j-driver";

const resolveInt = (val) => {
  if (neo4j.isInt(val)) {
    if (neo4j.integer.inSafeRange(val)) {
      return val.toNumber();
    } else {
      return val.toString();
    }
  } else {
    return val;
  }
};

export const convertNeo4jInts = (node) => {
  try {
    node.identity = resolveInt(node.identity);
    node.properties = Object.entries(node.properties).reduce(
      (acc, [key, value]) => {
        acc[key] = resolveInt(value);
        return acc;
      },
      {},
    );
    return node;
  } catch (error) {
    throw error;
  }
};

export const transformPathResults = (res) => {
  const result = res.map((item) => {
    const path = item.get("path");
    const rels = path.segments.map((seg) => {
      const { start, end } = seg;
      convertNeo4jInts(start);
      convertNeo4jInts(end);
      if (end.labels.includes("Fact")) {
        return end.properties;
      }
      return null;
    });
    const filteredRels = rels.filter((rel) => rel !== null);
    return filteredRels;
  });
  return result;
};

export const transformResult = (res) => {
  const item = convertNeo4jInts(res.toObject().r).properties;
  return {
    fact_uid: item.fact_uid,
    lh_object_uid: item.lh_object_uid,
    lh_object_name: item.lh_object_name,
    rel_type_uid: item.rel_type_uid,
    rel_type_name: item.rel_type_name,
    rh_object_uid: item.rh_object_uid,
    rh_object_name: item.rh_object_name,
    collection_uid: item.collection_uid,
    collection_name: item.collection_name,
    partial_definition: item.partial_definition,
    full_definition: item.full_definition,
    uom_uid: item.uom_uid,
    uom_name: item.uom_name,
  };
};

export const transformResults = (res) => {
  return res.map((item) => {
    return transformResult(item);
  });
};
