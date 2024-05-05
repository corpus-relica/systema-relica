export const ANYTHING = 730000;
// ---------------------------------- //
export const APPLICATION_CONTEXT = 4819;

export const INDV_REL_UID = 4658;
export const MIXED_REL_UID = 4719;
export const KIND_HEIR_UID = 5052; // hierarchical relation between kinds

export const CONC_POSS_ASP_UID = 2069; // conceptual possession of an aspect UID (relation)
export const REL_UID = 2850; // relation

//categories
export const OCCURRENCE_UID = 193671;
export const PHYSICAL_OBJECT_UID = 730044; // physical object
export const ROLE_UID = 160170;
export const RELATION_UID = 2850;
export const ASPECT_UID = 790229;
export const QUALITY_UID = 551008;
export const CATEGORY_UIDs = [
  OCCURRENCE_UID,
  PHYSICAL_OBJECT_UID,
  ROLE_UID,
  RELATION_UID,
  ASPECT_UID,
  // QUALITY_UID,
];

//BOOTSTRAPPING RELATION TYPES
//
// 1146 - is a specialization of
export const SPECIAL_REL_UID = 1146; // subtyping relation
// 4731 - requires a role-1 as a
// 4733 - requires a role-2 as a
// 4714 - can have a role as a
// 1981 - is a synonym of
// 1986 - is an inverse of

/*
(ns glsh-bcknd.bootstrapping)


(def classifUID 1225)    ;; classification relation
(def classifiedUID 3821)    ;; 3821 = classified individual thing
(def specialUID 1146)    ;; subtyping relation
(def transUID 4691)    ;; translation relation
(def aliasUID 1980)    ;; alias relation
(def binRelUID 5935)    ;; binary relation
(def subtypeRoleUID 3818)    ;; UID of 'subtype' (role)
(def supertypeRoleUID 3817)    ;; UID of 'supertype' (role)
(def synUID 1981)    ;; synonym relation
(def basePhraseUID 6066)    ;; base phrase for relation
(def inversePhraseUID 1986)    ;; inverse phrase for relations
(def qualSubtypeUID 4328)    ;;
(def indOrMixRelUID 6068)    ;;
(def indivRelUID 4658)    ;;
(def kindHierUID 5052)    ;; 5052 = hierarchical relation between kinds
(def kindKindUID 1231)    ;; 1231 = binary relation between things of specified kinds
(def kindRelUID 5937)    ;; 5937 = binary relation between kinds
(def mixedRelUID 4719)    ;;
(def specialRelUID 1146)    ;;
(def possAspUID 1727)    ;; 1727 = posession of an aspect by an individual thing
(def possessorUID 4290)    ;; 4290 - possessor of an aspect (role)
(def transRelUID 5520)    ;; 5520 - transitive relation
(def concPossAspUID 2069)    ;; conceptual possession of an aspect UID (relation)
(def concComplRelUID 4902)    ;; conceptual compliance UID (relation)
(def qualSubtypeUID 4328)    ;; qualitative subtype UID (role)
(def qualOptionsUID 4848)    ;; qualitative options UID (role)
(def concComplUID 4951)    ;; conceptually compliant UID (role)
(def concQuantUID 1791)    ;; conceptual quantification UID (relation)
(def qualifUID 4703)    ;; qualification relation
(def quantUID 2044)    ;; quantification of an aspect by a mathematical space
(def infoUID 970002)  ;; information
(def informativeUID 4173)    ;; role of informative qualitative information about an individual thing
(def concComposUID 1261)    ;; conceptual composition relation
(def concComponUID 3829)    ;; conceptual component role
(def involvedUID 4546)  ;; 4546 = <involved> being a second role
;;                              in an <involvement in an occurrence> relation
(def involvUID 4767)    ;; involvement in an occurrence (relation)
(def nextUID 5333)    ;; 5333 next element (role)
(def shallUID 5735)    ;;
(def composUID 1260)    ;;
(def concWholeUID 3830)    ;;
(def concPosessorUID 4705)    ;;
(def concBinRelKindsUID 1231)  ;;
(def componUID 730035)  ;; 730035 = component
(def propUID 551004)  ;; quantification on scale
(def modelLangUID 589296)  ;; 'mixed'
(def kindAndMixRelUID 7071)    ;;
(def English_uid 910036)
(def Dutch_uid 910037)
(def is_called_uid 5117)
(def first_role_uid 5944)    ;; 'by definition being a first role in a relation'
(def second_role_uid 5945)    ;; 'by definition being a second role in a relation'
(def by_def_role_of_ind 5343)  ;; 'by definition being a role of an individual thing'
(def indivUID 730067)  ;; 730067 represents the concept 'individual thing'
;;                             (with as subtypes kinds of phenomena as well as relations)

(def reqRole1UID 4731) ;; requires a role-1 as a
(def reqRole2UID 4733) ;; requires a role-2 as a
(def canHaveRoleUID 4714) ;; can have a role as a

(def naming-rels {specialRelUID true
                  aliasUID true
                  inversePhraseUID true})

(def naming-rels-too #{specialRelUID
                       aliasUID
                       inversePhraseUID})

(def boot-alias-uids [synUID, inversePhraseUID, basePhraseUID])

;; -- SPECIAL REL UIDS

(def qualificationOfAConcept 1726)
(def partialSpecializationOfAClass 5277)
;;(def ??? 6022)
(def byDefinitionBeingASpecifiedKindOfPhysicalObject 5396)
(def qualificationOfAQuantificationRelationByAScale 5683)

(def specialRelUIDs [specialRelUID
                     qualificationOfAConcept
                     partialSpecializationOfAClass
                     ;; 6022 ??
                     byDefinitionBeingASpecifiedKindOfPhysicalObject
                     qualificationOfAQuantificationRelationByAScale])

;; -- CLASSIF UIDS

(def classificationOfAPhysicalObjectByRole 1588)
(def classifUIDs [classifUID
                  classificationOfAPhysicalObjectByRole])

;; ----------------------------------------

 */
