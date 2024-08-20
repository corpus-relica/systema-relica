// export all of the exports from this directory
import { DNKPOstates } from './DNKPO';
import { DNKAstates } from './DNKA';
import { DNKRstates } from './DNKR';
import { DNKRelstates } from './DNKRel';
import { DNKOstates } from './DNKO';
import { DNKIstates } from './DNKI';
import { QAstates } from './QA';

export const states = {
  DNKPO: DNKPOstates,
  DNKA: DNKAstates,
  DNKR: DNKRstates,
  DNKRel: DNKRelstates,
  DNKO: DNKOstates,
  DNKI: DNKIstates,
  QA: QAstates,
};
