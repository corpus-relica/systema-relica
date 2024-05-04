export default function extractRelationships(records) {
  return records.map((record) => {
    // const relationships = record.relationships
    // const relationshipsKeys = Object.keys(relationships)
    // const relationshipsValues = Object.values(relationships)
    // const relationshipsArray = relationshipsKeys.map((key, index) => {
    //   return {
    //     [key]: relationshipsValues[index].data
    //   }
    // })
    // return {
    //   ...record,
    //   relationships: relationshipsArray
    // }
    return record.toObject();
  });
}
