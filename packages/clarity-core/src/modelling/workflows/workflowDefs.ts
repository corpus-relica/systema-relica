import PhysObjMachine from './PhysObjMachine';
import AspectMachine from './AspectMachine';
import RoleMachine from './RoleMachine';
import RelationMachine from './RelationMachine';
import OccurrenceMachine from './OccurrenceMachine';

import ConceptualInvolvementMachine from './ConceptualInvolvementMachine';

export const workflowDefs = {
  'new-physical-object': PhysObjMachine,
  'new-aspect': AspectMachine,
  'new-role': RoleMachine,
  'new-relation': RelationMachine,
  'new-occurrence': OccurrenceMachine,
  'new-cncpt-nvmnt': ConceptualInvolvementMachine,
};
