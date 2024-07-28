import { Fact } from '@relica/types';

export class GellishParser {
  private static readonly RELATION_REGEX =
    /^(\?)?(\d{1,2}\.|\d+\.)?([^>]*?)\s*(?::\s*(.+?))?\s*>\s*(\d{1,2}\.|\d+\.)?([^>]+?)\s*(?::\s*(.+?))?\s*>\s*(\?)?(\d{1,2}\.|\d+\.)?(.+?)$/;
  private static readonly ENTITY_REGEX = /^(.*?)(?:\.(.*))?$/;
  private static readonly METADATA_REGEX = /^@(\w+)=(.*)$/;

  parse(input: string[]): Fact[] {
    const facts: Fact[] = [];
    let currentMetadata: { [key: string]: string } = {};
    let sequence = 1;
    let isQuestion = false;

    for (const line of input) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('@')) {
        const metadataMatch = trimmedLine.match(GellishParser.METADATA_REGEX);
        if (metadataMatch) {
          currentMetadata[metadataMatch[1].toLowerCase()] = metadataMatch[2];
        }
        continue;
      }

      isQuestion =
        trimmedLine.startsWith('?') || trimmedLine.includes('.?') || isQuestion;
      if (isQuestion && !currentMetadata['intention']) {
        currentMetadata['intention'] = 'question';
      }

      const relationMatch = trimmedLine.match(GellishParser.RELATION_REGEX);
      if (relationMatch) {
        const [
          ,
          lhQuery,
          lhPlaceholder,
          left,
          leftRole,
          relPlaceholder,
          relation,
          rightRole,
          rhQuery,
          rhPlaceholder,
          right,
        ] = relationMatch;

        const parsedLeft = this.parseEntity(
          left,
          'lh_object',
          lhQuery,
          lhPlaceholder,
        );
        const parsedRelation = this.parseEntity(
          relation,
          'rel_type',
          false,
          relPlaceholder,
        );
        const parsedRight = this.parseEntity(
          right,
          'rh_object',
          rhQuery,
          rhPlaceholder,
        );

        const fact: Fact = {
          sequence: sequence++,
          lh_object_uid: parsedLeft.lh_object_uid || 0,
          rel_type_uid: parsedRelation.rel_type_uid || 0,
          rh_object_uid: parsedRight.rh_object_uid || 0,
          fact_uid: this.generateFactUid(),
          ...parsedLeft,
          ...parsedRelation,
          ...parsedRight,
          ...this.mapMetadata(currentMetadata),
        };

        if (leftRole) fact.lh_cardinalities = leftRole;
        if (rightRole) fact.rh_cardinalities = rightRole;

        facts.push(fact);
        currentMetadata = {}; // Reset metadata for next fact
        isQuestion = false; // Reset question flag for next fact
      }
    }

    return facts;
  }

  private parseEntity(
    entity: string,
    type: 'lh_object' | 'rel_type' | 'rh_object',
    isQuery: boolean | string | undefined,
    placeholder: string | undefined,
  ): Partial<Fact> {
    const result: Partial<Fact> = {};

    if (
      isQuery ||
      entity === '?' ||
      (placeholder && placeholder.endsWith('.'))
    ) {
      result[`${type}_uid`] = 0; // Use 0 to indicate a query
      result[`${type}_name`] = '?';

      if (placeholder) {
        const placeholderNum = parseInt(placeholder, 10);
        if (placeholderNum >= 1 && placeholderNum <= 99) {
          result[`${type}_placeholder`] = placeholderNum;
        }
      }
    } else {
      const match = entity.match(GellishParser.ENTITY_REGEX);
      if (match) {
        const [, uid, name] = match;
        result[`${type}_uid`] = parseInt(uid, 10);
        if (name) {
          result[`${type}_name`] = this.unquote(name);
        }
      }
    }

    return result;
  }

  private unquote(str: string): string {
    return str ? str.replace(/^"(.*)"$/, '$1') : '';
  }

  private generateFactUid(): number {
    return Math.floor(Math.random() * 1000000);
  }

  private mapMetadata(metadata: { [key: string]: string }): Partial<Fact> {
    const result: Partial<Fact> = {};
    const metadataMap: { [key: string]: keyof Fact } = {
      language: 'language',
      language_uid: 'language_uid',
      validity_context: 'validity_context_name',
      validity_context_uid: 'validity_context_uid',
      intention: 'intention',
      approval_status: 'approval_status',
      effective_from: 'effective_from',
      latest_update: 'latest_update',
      author: 'author',
      reference: 'reference',
      collection: 'collection_name',
      collection_uid: 'collection_uid',
      remarks: 'remarks',
    };

    for (const [key, value] of Object.entries(metadata)) {
      const factKey = metadataMap[key];
      if (factKey) {
        if (factKey.endsWith('_uid')) {
          (result[factKey] as number) = parseInt(value, 10);
        } else {
          (result[factKey] as string) = value;
        }
      }
    }

    return result;
  }
}
