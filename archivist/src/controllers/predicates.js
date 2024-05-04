import {
  getClassificationFact,
  getSpecializationHierarchy,
} from "./gellishBaseController.js";

// This function is declared as async, meaning it returns a Promise and can contain 'await' expressions.
export const isClassifiedAsP = async (indvUID, kindUID) => {
  // Call the getClassificationFact function with indvUID as an argument.
  // This function is awaited, meaning execution will pause until the Promise it returns is resolved.
  const classificationFact = await getClassificationFact(indvUID);

  // Check if a classification fact was found (i.e., if classificationFact is truthy).
  if (classificationFact) {
    const { rh_object_uid } = classificationFact;

    // Check if rh_object_uid is equal to kindUID.
    if (rh_object_uid === kindUID) {
      // If they are equal, the function returns true.
      return true;
    }

    // Call the getSpecializationHierarchy function with rh_object_uid as an argument.
    // This function is awaited, meaning execution will pause until the Promise it returns is resolved.
    const specializationHierarchy = await getSpecializationHierarchy(
      rh_object_uid
    );

    // Check if a specialization hierarchy was found (i.e., if specializationHierarchy is truthy).
    if (specializationHierarchy) {
      // Map the specializationHierarchy array to an array of lh_object_uid values.
      // Then, check if kindUID is included in this array.
      // If kindUID is found in the array, the function returns true.
      const list = specializationHierarchy.map((rel) => rel.lh_object_uid);
      return list.includes(kindUID);
    }
  }

  // If no classification fact was found, or if rh_object_uid was not equal to kindUID
  // and no specialization hierarchy was found or kindUID was not in the specialization hierarchy, the function returns false.
  return false;
};
