import { Logger } from '@nestjs/common';
import { Fact } from '@relica/types'; // Ensure this path is correct

// Utility function to check if a UID is temporary (variable)
const isTempUID = (uid: number) => uid >= 1 && uid <= 99;

export class QueryResultAggregator {
  private readonly logger = new Logger(QueryResultAggregator.name);

  aggregateResults(results: Fact[][], queryTable: Fact[]): Fact[] {
    this.logger.verbose('Aggregating results');

    // Step 1: Identify variables
    const variables = this.identifyVariables(queryTable);
    variables.forEach((positions, varId) => {
      this.logger.verbose(
        `Variable ${varId} found at positions`,
        Array.from(positions),
      );
    });

    // Step 2: Group results by variable
    const groupedResults = this.groupResultsByVariable(
      results,
      variables,
      queryTable,
    );
    // this.logger.verbose(
    //   'Aggregating results, group results by variable',
    //   Object.fromEntries(groupedResults),
    // );

    // Step 3: Intersect results for each variable
    const intersectedResults = this.intersectResults(groupedResults);
    this.logger.verbose(
      'Aggregating results, intersected results',
      Object.fromEntries(intersectedResults),
    );

    // Step 4: Combine results
    const combinedResults = this.combineResults(intersectedResults, queryTable);

    this.logger.verbose('Aggregation complete', { combinedResults });
    return combinedResults;
  }

  private identifyVariables(queryTable: Fact[]): Map<number, Set<string>> {
    const variables = new Map<number, Set<string>>();
    queryTable.forEach((row, index) => {
      if (isTempUID(row.lh_object_uid)) {
        if (!variables.has(row.lh_object_uid)) {
          variables.set(row.lh_object_uid, new Set());
        }
        variables.get(row.lh_object_uid)!.add(`${index}.lh`);
      }
      if (isTempUID(row.rh_object_uid)) {
        if (!variables.has(row.rh_object_uid)) {
          variables.set(row.rh_object_uid, new Set());
        }
        variables.get(row.rh_object_uid)!.add(`${index}.rh`);
      }
    });
    return variables;
  }

  private groupResultsByVariable(
    results: Fact[][],
    variables: Map<number, Set<string>>,
    queryTable: Fact[],
  ): Map<number, [Fact, number][]> {
    const groupedResults = new Map<number, [Fact, number][]>();
    variables.forEach((positions, varId) => {
      const varResults: [Fact, number][] = [];
      positions.forEach((pos) => {
        const [rowIndex, side] = pos.split('.');
        const relevantResults = results[Number(rowIndex)];
        relevantResults.forEach((fact) => {
          varResults.push([
            fact,
            side === 'lh' ? fact.lh_object_uid : fact.rh_object_uid,
          ]);
        });
      });
      groupedResults.set(varId, varResults);
    });
    return groupedResults;
  }

  private intersectResults(
    groupedResults: Map<number, [Fact, number][]>,
  ): Map<number, [Fact, number][]> {
    const intersectedResults = new Map<number, [Fact, number][]>();
    groupedResults.forEach((factValuePairs, varId) => {
      // Count occurrences of each value
      const valueCounts = new Map<number, number>();
      factValuePairs.forEach(([_, value]) => {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      });

      // Find the number of unique positions for this variable
      const positionCount = new Set(
        factValuePairs.map(([fact]) =>
          fact.lh_object_uid === varId ? 'lh' : 'rh',
        ),
      ).size;

      // Keep only values that appear in all positions
      const consistentValues = new Set(
        [...valueCounts.entries()]
          .filter(([_, count]) => count === positionCount)
          .map(([value]) => value),
      );

      const intersectedPairs = factValuePairs.filter(([_, value]) =>
        consistentValues.has(value),
      );
      intersectedResults.set(varId, intersectedPairs);
    });
    return intersectedResults;
  }

  private combineResults(
    intersectedResults: Map<number, [Fact, number][]>,
    queryTable: Fact[],
  ): Fact[] {
    const combinedResults: Fact[] = [];
    const resolvedVariables = new Map<number, number>();

    intersectedResults.forEach((factValuePairs, varId) => {
      if (factValuePairs.length > 0) {
        resolvedVariables.set(varId, factValuePairs[0][1]);
      }
    });

    queryTable.forEach((queryRow) => {
      const combinedFact: Fact = { ...queryRow };

      if (isTempUID(queryRow.lh_object_uid)) {
        combinedFact.lh_object_uid =
          resolvedVariables.get(queryRow.lh_object_uid) ||
          queryRow.lh_object_uid;
      }
      if (isTempUID(queryRow.rh_object_uid)) {
        combinedFact.rh_object_uid =
          resolvedVariables.get(queryRow.rh_object_uid) ||
          queryRow.rh_object_uid;
      }

      combinedFact.intention =
        (isTempUID(queryRow.lh_object_uid) &&
          !resolvedVariables.has(queryRow.lh_object_uid)) ||
        (isTempUID(queryRow.rh_object_uid) &&
          !resolvedVariables.has(queryRow.rh_object_uid))
          ? 'denial'
          : 'confirmation';

      combinedResults.push(combinedFact);
    });

    return combinedResults;
  }
}
