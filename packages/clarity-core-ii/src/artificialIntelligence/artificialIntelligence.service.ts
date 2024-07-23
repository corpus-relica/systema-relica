import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

import { ArchivistService } from '../archivist/archivist.service';
import { Fact } from '@relica/types';

@Injectable()
export class ArtificialIntelligenceService {
  private readonly logger = new Logger(ArtificialIntelligenceService.name);

  constructor(private readonly archivistService: ArchivistService) {}

  async conjureDefinition(
    apiKey: string,
    supertypeUID: number,
    newKindName: string,
  ) {
    this.logger.log('~~~~~~~~~~~~CONJURE DEFINITION~~~~~~~~~~~~');

    const SH: any =
      await this.archivistService.getSpecializationHierarchy(supertypeUID);

    const shStr: string = SH.facts
      .map(
        (f: Fact) =>
          `${f.lh_object_name} : is a specialization of : ${f.rh_object_name} :: ${f.partial_definition}`,
      )
      .join('\n');

    let sysPrompt: string = `
You are an expert in ontology and concept hierarchies. You've been given a hierarchical structure of concepts, each defined in the format:

[Specific Concept] : is a specialization of : [General Concept] :: [Definition]

Your task is to generate a logical and consistent definition for a new concept that follows this pattern. The definition should:
1. Be consistent with the existing hierarchy
2. Add specific characteristics that distinguish it from its parent concept
3. Be concise but informative
4. Use similar language and style as the existing definitions

Here's the hierarchy for context:

${shStr}

Now, complete the following new entry in the same style:

[New Concept] : is a specialization of : [Parent Concept] ::

Provide only the definition, starting after the double colon (::).
`;

    this.logger.log('sysPrompt--->', sysPrompt);
    const userPrompt: string = `${newKindName} : is a specialization of : ${SH.facts[SH.facts.length - 1].lh_object_name} ::`;
    this.logger.log('userPrompt--->', userPrompt);

    const client = new OpenAI({
      apiKey, // This is the default and can be omitted
    });

    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-3.5-turbo',
    });

    // console.log('GOt chat completion', chatCompletion);

    return chatCompletion;
  }
}
