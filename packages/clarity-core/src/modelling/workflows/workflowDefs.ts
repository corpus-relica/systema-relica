import PhysObjMachine from './PhysObjMachine';
import AspectMachine from './AspectMachine';
import RoleMachine from './RoleMachine';
import RelationMachine from './RelationMachine';
import OccurrenceMachine from './OccurrenceMachine';
import InvolvementMachine from './InvolvementMachine';
import AspectQualificationMachine from './AspectQualificationMachine';

export const workflowDefs = {
  DNKPO: PhysObjMachine,
  DNKA: AspectMachine,
  DNKR: RoleMachine,
  DNKRel: RelationMachine,
  DNKO: OccurrenceMachine,
  DNKI: InvolvementMachine,
  QA: AspectQualificationMachine,
};
