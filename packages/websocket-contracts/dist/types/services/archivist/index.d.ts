/**
 * @fileoverview Archivist Service WebSocket Contracts
 *
 * Complete WebSocket API contracts for the Archivist service, which handles
 * knowledge graph operations, search, facts, concepts, and data management.
 */
export * from './facts';
export * from './search';
export * from './concepts';
export * from './query';
export * from './kinds';
export * from './uids';
export * from './completion';
export * from './definition';
export * from './submission';
export * from './transaction';
export * from './validation';
import { FactActions, FactEvents, type FactActionType, type FactEventType } from './facts';
import { SearchActions, SearchEvents, type SearchActionType, type SearchEventType } from './search';
import { ConceptActions, ConceptEvents, type ConceptActionType, type ConceptEventType } from './concepts';
import { QueryActions, QueryEvents, type QueryActionType, type QueryEventType } from './query';
import { KindActions, KindEvents, type KindActionType, type KindEventType } from './kinds';
import { UIDActions, UIDEvents, type UIDActionType, type UIDEventType } from './uids';
import { CompletionActions, CompletionEvents, type CompletionActionType, type CompletionEventType } from './completion';
import { DefinitionActions, DefinitionEvents, type DefinitionActionType, type DefinitionEventType } from './definition';
import { SubmissionActions, SubmissionEvents, type SubmissionActionType, type SubmissionEventType } from './submission';
import { TransactionActions, TransactionEvents, type TransactionActionType, type TransactionEventType } from './transaction';
import { ValidationActions, ValidationEvents, type ValidationActionType, type ValidationEventType } from './validation';
export { FactActions, FactEvents, type FactActionType, type FactEventType, };
export { SearchActions, SearchEvents, type SearchActionType, type SearchEventType, };
export { ConceptActions, ConceptEvents, type ConceptActionType, type ConceptEventType, };
export { QueryActions, QueryEvents, type QueryActionType, type QueryEventType, };
export { KindActions, KindEvents, type KindActionType, type KindEventType, };
export { UIDActions, UIDEvents, type UIDActionType, type UIDEventType, };
export { CompletionActions, CompletionEvents, type CompletionActionType, type CompletionEventType, };
export { DefinitionActions, DefinitionEvents, type DefinitionActionType, type DefinitionEventType, };
export { SubmissionActions, SubmissionEvents, type SubmissionActionType, type SubmissionEventType, };
export { TransactionActions, TransactionEvents, type TransactionActionType, type TransactionEventType, };
export { ValidationActions, ValidationEvents, type ValidationActionType, type ValidationEventType, };
export declare const ArchivistActions: {
    readonly VALIDATE: "validation:validate";
    readonly COLLECTION: "validation:collection";
    readonly START: "transaction:start";
    readonly COMMIT: "transaction:commit";
    readonly ROLLBACK: "transaction:rollback";
    readonly GET: "transaction:get";
    readonly SUBMIT: "submission:submit";
    readonly BATCH: "submission:batch";
    readonly UPDATE: "definition:update";
    readonly REQUEST: "completion:request";
    readonly ENTITIES: "completion:entities";
    readonly RELATIONS: "completion:relations";
    readonly GENERATE: "uid:generate";
    readonly RESERVE: "uid:reserve";
    readonly LIST: "kinds:list";
    readonly SEARCH: "kinds:search";
    readonly EXECUTE: "query:execute";
    readonly PARSE: "query:parse";
    readonly CREATE: "concept:create";
    readonly DELETE: "concept:delete";
    readonly GENERAL: "search:general";
    readonly INDIVIDUAL: "search:individual";
    readonly KIND: "search:kind";
    readonly UID: "search:uid";
    readonly GET_SUBTYPES: "fact:getSubtypes";
    readonly GET_SUPERTYPES: "fact:getSupertypes";
    readonly GET_CLASSIFIED: "fact:getClassified";
};
//# sourceMappingURL=index.d.ts.map