import neo4j from 'neo4j-driver';
import { GraphService } from 'src/graph/graph.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExecuteSearchQueryService {
    constructor(private readonly graphService: GraphService) {}

    async executeSearchQuery(
        searchQuery,
        countQuery,
        searchTerm,
        relTypeUIDs = [],
        filterUIDs = [],
        collectionUID,
        page = 1,
        pageSize = 10,
        exactMatch = false,
    ) {
        const skip = (page - 1) * pageSize;
        const result = await this.graphService.execQuery(searchQuery, {
            searchTerm,
            relTypeUIDs,
            filterUIDs,
            collectionUID: '',
            skip: neo4j.int(skip),
            pageSize: neo4j.int(pageSize),
            exactMatch,
        });

        const transformedResult = result.map((item) =>
            this.graphService.transformResult(item),
        );

        const countResult = await this.graphService.execQuery(countQuery, {
            searchTerm,
            relTypeUIDs,
            filterUIDs,
            collectionUID: '',
            skip: neo4j.int(skip),
            pageSize: neo4j.int(pageSize),
            exactMatch,
        });

        const totalCount = countResult[0]?.get('total').toNumber() ?? 0;

        return {
            facts: transformedResult,
            totalCount,
        };
    }
}
