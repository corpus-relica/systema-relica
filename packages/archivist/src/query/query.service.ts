import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { FactRetrievalService } from 'src/fact-retrieval/fact-retrieval.service';
import { Fact } from '@relica/types';

type VariableState = {
  name: string;
  possibleValues: number[];
  isResolved: boolean;
};

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly factRetrieval: FactRetrievalService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  async interpretTable(table: Fact[]): Promise<{ facts: Fact[]; vars: any[] }> {
    // this.logger.verbose('handleGellishQuery', table);
    const variableStates = new Map<number, VariableState>();
    const results: Fact[] = [];

    for (const row of table) {
      const rowResults = await this.executeQuery(row, variableStates);
      results.push(...rowResults);

      if (rowResults.length === 0) {
        // this.logger.warn('Query failed: no results for row', row);
        return { facts: [], vars: [] }; // Query fails if any row produces no results
      }

      this.updateVariableStates(row, rowResults, variableStates);

      // if (variableStates.size === 0) {
      //   this.logger.warn('Query failed: no variable states');
      //   return []; // Query fails if no variable states found
      // }
    }

    // this.logger.verbose('Query results', results);

    // return
    // return results;
    return {
      facts: await this.finalizeResults(results, variableStates),
      vars: Array.from(variableStates.entries()).map(([key, value]) => ({
        uid: key,
        name: value.name,
        possibleValues: value.possibleValues,
        isResolved: value.isResolved,
      })),
    };
  }

  private async executeQuery(
    row: Fact,
    variableStates: Map<number, VariableState>,
  ): Promise<Fact[]> {
    // this.logger.verbose('executeQuery', row);

    const { lh_object_uid, rel_type_uid, rh_object_uid } = row;

    const lh = this.resolveValue(lh_object_uid, variableStates);
    const rel = this.resolveValue(rel_type_uid, variableStates);
    const rh = this.resolveValue(rh_object_uid, variableStates);

    // this.logger.verbose('object ids', {
    //   lh_object_uid,
    //   rel_type_uid,
    //   rh_object_uid,
    // });
    // this.logger.verbose('Resolved values', { lh, rel, rh });
    const result: Fact[] = await this.factRetrieval.confirmFactInRelationCone(
      lh,
      rel,
      rh,
    );
    // this.logger.verbose('result', result);

    if (result.length === 0) {
      return [{ ...row, intention: 'denial' }];
    } else {
      return result.map((r: Fact) => ({ ...r, intention: 'confirmation' }));
    }
  }

  private resolveValue(
    value: number,
    variableStates: Map<number, VariableState>,
  ): number[] | null {
    if (!this.isTempUID(value)) {
      return [value];
    }

    const state = variableStates.get(value);
    // this.logger.verbose('resolveValue -------------------------', state);
    // this.logger.verbose('variableStates', variableStates.keys());

    if (state?.possibleValues?.length > 0) {
      return state.possibleValues;
    }

    if (!state || !state.isResolved || state.possibleValues.length === 0) {
      return null; // Unresolved variable
    }

    return null;
  }

  private updateVariableStates(
    row: Fact,
    results: Fact[],
    variableStates: Map<number, VariableState>,
  ) {
    // this.logger.verbose('updateVariableStates', { row, results });

    this.updateVariableState(
      row.lh_object_uid,
      row.lh_object_name,
      results.map((r) => r.lh_object_uid),
      variableStates,
    );
    this.updateVariableState(
      row.rel_type_uid,
      row.rel_type_name,
      results.map((r) => r.rel_type_uid),
      variableStates,
    );
    this.updateVariableState(
      row.rh_object_uid,
      row.rh_object_name,
      results.map((r) => r.rh_object_uid),
      variableStates,
    );
  }

  private updateVariableState(
    value: number,
    name: string,
    newValues: number[],
    variableStates: Map<number, VariableState>,
  ) {
    if (!this.isTempUID(value)) {
      return;
    }

    // this.logger.verbose('updateVariableState', { value, newValues });
    const currentState = variableStates.get(value) || {
      name,
      possibleValues: [],
      isResolved: false,
    };
    const updatedValues =
      currentState.possibleValues.length === 0
        ? newValues
        : currentState.possibleValues.filter((v) => newValues.includes(v));

    variableStates.set(
      value,
      Object.assign({}, currentState, {
        possibleValues: [...new Set(updatedValues)], // Ensure uniqueness
        isResolved: updatedValues.length === 1,
      }),
    );
    // this.logger.verbose('updateVariableState end', variableStates.get(value));
  }

  private async finalizeResults(
    results: Fact[],
    variableStates: Map<number, VariableState>,
  ): Promise<Fact[]> {
    //interate through entries of variableStates
    //use gellishBaseService.getClassificationFact to get the classification fact
    //append that to results
    let resPreamble = [];
    for (const [key, value] of variableStates) {
      for (const v of value.possibleValues) {
        const classificationFact = (
          await this.gellishBaseService.getClassificationFact(v)
        )[0];
        if (classificationFact) {
          resPreamble.push({
            ...classificationFact,
            intention: 'confirmation',
          });
        }
      }
    }

    let res = results.map((fact) => ({
      ...fact,
      intention: 'confirmation',
      //     lh_object_uid: this.finalizeValue(fact.lh_object_uid, variableStates),
      //     rel_type_uid: this.finalizeValue(fact.rel_type_uid, variableStates),
      //     rh_object_uid: this.finalizeValue(fact.rh_object_uid, variableStates),
    }));

    return [...resPreamble, ...res];
  }

  // private finalizeValue(
  //   value: number,
  //   variableStates: Map<number, VariableState>,
  // ): number | number[] {
  //   if (!this.isTempUID(value)) {
  //     return value;
  //   }
  //   const state = variableStates.get(value);
  //   if (!state) {
  //     return value; // Return original value if no state found (shouldn't happen)
  //   }
  //   return state.isResolved ? state.possibleValues[0] : state.possibleValues;
  // }

  private isTempUID(uid: number): boolean {
    return uid >= 1 && uid <= 99;
  }
}
