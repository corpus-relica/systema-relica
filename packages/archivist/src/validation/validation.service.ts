import { Injectable } from '@nestjs/common';

import { ANYTHING, APPLICATION_CONTEXT } from 'src/bootstrapping';
import { EntityRetrievalService } from 'src/entity-retrieval/entity-retrieval.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@Injectable()
export class ValidationService {
    constructor(
        private readonly entityRetrievalService: EntityRetrievalService,
        private readonly gellishBaseService: GellishBaseService,
    ) {}

    async canPlayRoleP(entity_uid, role_uid) {
        const type =
            await this.entityRetrievalService.getEntityType(entity_uid);
        let kind_uid;
        if (type === 'individual') {
            const classFact =
                await this.gellishBaseService.getClassificationFact(entity_uid);
            console.log('classFact:', classFact);
            kind_uid = classFact[0].rh_object_uid;
        } else {
            kind_uid = entity_uid;
        }

        // get possibleRolePlayers for role_uid
        const possibleRolePlayers =
            await this.gellishBaseService.getPossibleRolePlayers(role_uid);
        // console.log("possibleRolePlayers:", possibleRolePlayers, role_uid, kind_uid);
        let idx = 0;
        while (idx < possibleRolePlayers.length) {
            const rp_name = possibleRolePlayers[idx].lh_object_name;
            const rp_uid = possibleRolePlayers[idx].lh_object_uid;
            if (rp_uid === ANYTHING || rp_uid === kind_uid) {
                return true;
            }
            const sh =
                await this.gellishBaseService.getSpecializationHierarchy(
                    kind_uid,
                );
            const isSubtypeOfRolePlayer = sh.facts.reduce((memo, fact) => {
                return memo || fact.rh_object_uid === rp_uid;
            }, false);
            if (isSubtypeOfRolePlayer) return true;
            idx++;
        }

        return false;
    }

    async validateUIDNamePair(uid, name) {
        console.log('validateUIDNamePair:', uid, name);
        // realistically we need to check if uid is a Kind or an Individual first
        // for now we assume it's a Kind
        const names = await this.gellishBaseService.getNames(parseInt(uid));
        console.log('names:', names);
        return names.includes(name);
    }

    async validateValidityContext(valid_ctx_uid, valid_ctx_name) {
        console.log('validateValidityContext:', valid_ctx_uid, valid_ctx_name);
        // -- valid_ctx does not need to be defined, but if it is both uid and name must be defined
        if (
            (valid_ctx_uid !== '' && valid_ctx_name === '') ||
            (valid_ctx_uid === '' && valid_ctx_name !== '')
        ) {
            return {
                isValid: false,
                message:
                    'valid_ctx_name must be defined if valid_ctx_uid is defined, and vice versa',
            };
        } else if (
            valid_ctx_uid !== undefined &&
            valid_ctx_name !== undefined &&
            valid_ctx_uid !== '' &&
            valid_ctx_name !== ''
        ) {
            // -- if ctx name and uid are defined they must match
            const ctxNameAndUIDAlign = await this.validateUIDNamePair(
                valid_ctx_uid,
                valid_ctx_name,
            );
            if (!ctxNameAndUIDAlign) {
                return {
                    isValid: false,
                    message: 'valid_ctx_uid and valid_ctx_name do not align',
                };
            }
            // -- if ctx name and uid are defined they must be a valid context
            const isAppCtx = await this.isClassifiedAsP(
                valid_ctx_uid,
                APPLICATION_CONTEXT,
            );
            if (!isAppCtx) {
                return {
                    isValid: false,
                    message:
                        'valid_ctx_uid must be a valid application context (' +
                        APPLICATION_CONTEXT +
                        ')',
                };
            }
        }

        return {
            isValid: true,
            message: '',
        };
    }

    async simpleValidateBinaryFact(fact) {
        const {
            lh_object_uid,
            lh_object_name,
            rh_object_uid,
            rh_object_name,
            rel_type_uid,
            rel_type_name,
            valid_ctx_uid,
            valid_ctx_name,
            reference,
        } = fact;
        console.log('simpleValidateBinaryFact:');
        console.log(fact);
        console.log(
            lh_object_uid,
            ', ',
            lh_object_name,
            ', ',
            rh_object_uid,
            ', ',
            rh_object_name,
            ', ',
            rel_type_uid,
            ', ',
            rel_type_name,
            ', ',
            valid_ctx_uid,
            ', ',
            valid_ctx_name,
        );

        // Determine if UIDs are unknown
        const LHUnknownUID =
            parseInt(lh_object_uid) >= 1 && parseInt(lh_object_uid) <= 99;
        const RHUnknownUID =
            parseInt(rh_object_uid) >= 1 && parseInt(rh_object_uid) <= 99;

        // Check necessary fields are defined
        if (
            rh_object_uid === '' ||
            rel_type_uid === '' ||
            lh_object_uid === ''
        ) {
            return {
                isValid: false,
                message: 'all fields must be filled',
            };
        }

        // Check Validity Context
        const validityContext = await this.validateValidityContext(
            valid_ctx_uid,
            valid_ctx_name,
        );
        if (!validityContext.isValid) {
            return validityContext;
        }

        // Check if the names in uids even line up
        const qux = LHUnknownUID
            ? true
            : await this.validateUIDNamePair(lh_object_uid, lh_object_name);
        const quux = await this.validateUIDNamePair(
            rel_type_uid,
            rel_type_name,
        );
        const bat = await this.validateUIDNamePair(
            rh_object_uid,
            rh_object_name,
        );

        if (!qux) {
            return {
                isValid: false,
                message: 'lh_object_uid and lh_object_name do not match',
            };
        }
        if (!quux) {
            return {
                isValid: false,
                message: 'rel_type_uid and rel_type_name do not match',
            };
        }
        if (!bat) {
            return {
                isValid: false,
                message: 'rh_object_uid and rh_object_name do not match',
            };
        }

        // Check for and deal with unkown UIDs case
        // don't accept unkown UIDs in the rh_uid position
        if (RHUnknownUID) {
            return {
                isValid: false,
                message: 'Right hand side must be a UID of a known entity',
            };
        }

        // do accept unkown UIDs in the lh_uid position
        if (LHUnknownUID) {
            // but only if the relation is 'is classified as a ' or 'is a specialization of'
            if (rel_type_uid !== '1146' && rel_type_uid !== '1225') {
                return {
                    isValid: false,
                    message:
                        "unkown UIDs can only be used with 'is classified as a ' or 'is a specialization of' relations",
                };
            }
            // further validation here...
            // for instance, check if rh_uid is a valid UID (in the database)
            // if rh_uid aligns with rh_name
            // if rel_type_uid aligns with rel_type_name
            // maybe check if lh_name already exists in db and throw warning if it does
            return {
                isValid: true,
                message: '',
            };
        }

        let message = '';
        // use rel_type_uid to find required roles 1 & 2
        const role1 = await this.gellishBaseService.getRequiredRole1(
            parseInt(rel_type_uid),
        );
        const role2 = await this.gellishBaseService.getRequiredRole2(
            parseInt(rel_type_uid),
        );
        const foo = await this.canPlayRoleP(
            parseInt(lh_object_uid),
            role1.rh_object_uid,
        );
        message += !foo
            ? `(${lh_object_name}) can't play role1 (${role1.rh_object_name}) of relation (${rel_type_name}).  `
            : '';
        const bar = await this.canPlayRoleP(
            parseInt(rh_object_uid),
            role2.rh_object_uid,
        );
        message += !bar
            ? `(${rh_object_name}) can't play role2 (${role2.rh_object_name}) of relation (${rel_type_name}).`
            : '';
        return {
            isValid: foo && bar,
            message,
        };
    }

    ///-------------------------------------------------------------------------

    // This function is declared as async, meaning it returns a Promise and can contain 'await' expressions.
    async isClassifiedAsP(indvUID, kindUID) {
        // Call the getClassificationFact function with indvUID as an argument.
        // This function is awaited, meaning execution will pause until the Promise it returns is resolved.
        const classificationFact =
            await this.gellishBaseService.getClassificationFact(indvUID);

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
            const specializationHierarchy =
                await this.gellishBaseService.getSpecializationHierarchy(
                    rh_object_uid,
                );

            // Check if a specialization hierarchy was found (i.e., if specializationHierarchy is truthy).
            if (specializationHierarchy) {
                // Map the specializationHierarchy array to an array of lh_object_uid values.
                // Then, check if kindUID is included in this array.
                // If kindUID is found in the array, the function returns true.
                const list = specializationHierarchy.facts.map(
                    (rel) => rel.lh_object_uid,
                );
                return list.includes(kindUID);
            }
        }

        // If no classification fact was found, or if rh_object_uid was not equal to kindUID
        // and no specialization hierarchy was found or kindUID was not in the specialization hierarchy, the function returns false.
        return false;
    }
}
