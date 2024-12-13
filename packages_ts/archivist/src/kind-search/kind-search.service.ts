import {
    textSearchQuery,
    countTextSearchQuery,
    uidSearchQuery,
    countUIDSearchQuery,
} from 'src/graph/queries';

import { Injectable } from '@nestjs/common';
import { ExecuteSearchQueryService } from 'src/execute-search-query/execute-search-query.service';

@Injectable()
export class KindSearchService {
    constructor(
        private readonly executeSearchQueryService: ExecuteSearchQueryService,
    ) {}

    async getTextSearchKind(
        searchTerm,
        collectionUID,
        page = 1,
        pageSize = 10,
    ) {
        const res = await this.executeSearchQueryService.executeSearchQuery(
            textSearchQuery,
            countTextSearchQuery,
            searchTerm,
            [1146, 1981],
            [],
            collectionUID,
            page,
            pageSize,
            false, // exactMatch
        );
        return res;
    }

    async getUIDSearchKind(searchTerm, collectionUID, page = 1, pageSize = 50) {
        const res = await this.executeSearchQueryService.executeSearchQuery(
            uidSearchQuery,
            countUIDSearchQuery,
            searchTerm,
            [1146, 1981],
            [],
            collectionUID,
            page,
            pageSize,
            false, // exactMatch
        );
        return res;
    }
}
