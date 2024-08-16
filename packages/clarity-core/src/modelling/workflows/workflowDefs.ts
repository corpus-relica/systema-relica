import PhysObjMachine from './PhysObjMachine';
import AspectMachine from './AspectMachine';
import RoleMachine from './RoleMachine';
import RelationMachine from './RelationMachine';
import OccurrenceMachine from './OccurrenceMachine';

import ConceptualInvolvementMachine from './ConceptualInvolvementMachine';

export const workflowDefs = {
  DNKPO: PhysObjMachine,
  DNKA: AspectMachine,
  DNKRol: RoleMachine,
  DNKRel: RelationMachine,
  DNKO: OccurrenceMachine,
  'new-cncpt-nvmnt': ConceptualInvolvementMachine,
};
