import { baseFact } from "../../baseFact";

export const plusIntrinsicAspectFacts = (props: any) => {
  const { facts, uid, preferredName, supertype, intrinsicAspects, collection } =
    props;

  const newFacts = [...facts];

  if (Array.isArray(intrinsicAspects) && intrinsicAspects.length > 0) {
    intrinsicAspects.forEach((ia: any) => {
      const {
        existingIntrinsicAspect,
        supertypeIntrinsicAspect,
        definition,
        conceptualAspect,
        newQualificationOfConceptualAspect,
        existingQualificationOfConceptualAspect,
      } = ia;

      if (existingIntrinsicAspect) {
        newFacts.push({
          ...baseFact,
          lh_object_uid: uid.toString(),
          lh_object_name: preferredName,
          rel_type_uid: "5848",
          rel_type_name: "has by definition as intrinsic aspect a",
          rh_object_uid: existingIntrinsicAspect.lh_object_uid.toString(),
          rh_object_name: existingIntrinsicAspect.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
      }

      if (supertypeIntrinsicAspect) {
        newFacts.push({
          ...baseFact,
          lh_object_uid: "xxx",
          lh_object_name: ia.preferredName,
          rel_type_uid: "1146",
          rel_type_name: "is a specialization of",
          rh_object_uid: supertypeIntrinsicAspect.lh_object_uid.toString(),
          rh_object_name: supertypeIntrinsicAspect.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
          full_definition: definition,
          partial_definition: definition,
        });

        newFacts.push({
          ...baseFact,
          lh_object_uid: "xxx",
          lh_object_name: ia.preferredName,
          rel_type_uid: "5848",
          rel_type_name: "is by definition an intrinsic aspect of a",
          rh_object_uid: uid.toString(),
          rh_object_name: preferredName,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });

        if (conceptualAspect) {
          newFacts.push({
            ...baseFact,
            lh_object_uid: supertype.lh_object_uid.toString(),
            lh_object_name: supertype.lh_object_name,
            rel_type_uid: "5652",
            rel_type_name: "has subtypes that have as distinguishing aspect a",
            rh_object_uid: conceptualAspect.lh_object_uid.toString(),
            rh_object_name: conceptualAspect.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });

          newFacts.push({
            ...baseFact,
            lh_object_uid: "xxx",
            lh_object_name: ia.preferredName,
            rel_type_uid: "5817",
            rel_type_name: "is by definition an intrinsic",
            rh_object_uid: conceptualAspect.lh_object_uid.toString(),
            rh_object_name: conceptualAspect.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });

          if (newQualificationOfConceptualAspect) {
            newFacts.push({
              ...baseFact,
              lh_object_uid: "yyy",
              lh_object_name: newQualificationOfConceptualAspect.preferredName,
              rel_type_uid: "1726",
              rel_type_name: "is a qualitative subtype of",
              rh_object_uid: conceptualAspect.lh_object_uid.toString(),
              rh_object_name: conceptualAspect.lh_object_name,
              collection_uid: collection.uid,
              collection_name: collection.name,
              partial_definition: newQualificationOfConceptualAspect.definition,
              full_definition: newQualificationOfConceptualAspect.definition,
            });
            newFacts.push({
              ...baseFact,
              lh_object_uid: "xxx",
              lh_object_name: ia.preferredName,
              rel_type_uid: "5283",
              rel_type_name: "is by definition qualified as",
              rh_object_uid: "yyy",
              rh_object_name: newQualificationOfConceptualAspect.preferredName,
              collection_uid: collection.uid,
              collection_name: collection.name,
            });
          } else if (existingQualificationOfConceptualAspect) {
            newFacts.push({
              ...baseFact,
              lh_object_uid: "xxx",
              lh_object_name: ia.preferredName,
              rel_type_uid: "5283",
              rel_type_name: "is by definition qualified as",
              rh_object_uid:
                existingQualificationOfConceptualAspect.lh_object_uid.toString(),
              rh_object_name:
                existingQualificationOfConceptualAspect.lh_object_name,
              collection_uid: collection.uid,
              collection_name: collection.name,
            });
          }
        }
      }
    });
  }

  return newFacts;
};
