import { Injectable } from '@nestjs/common';
import { ExecuteSearchQueryService } from 'src/execute-search-query/execute-search-query.service';
import {
    textSearchQuery,
    countTextSearchQuery,
    uidSearchQuery,
    countUIDSearchQuery,
} from 'src/graph/queries';

@Injectable()
export class IndividualSearchService {
    constructor(
        private readonly executeSearchQueryService: ExecuteSearchQueryService,
    ) {}

    async getTextSearchIndividual(
        searchTerm,
        collectionUID,
        page = 1,
        pageSize = 10,
    ) {
        const res = await this.executeSearchQueryService.executeSearchQuery(
            textSearchQuery,
            countTextSearchQuery,
            searchTerm,
            [1225],
            [],
            collectionUID,
            page,
            pageSize,
            false, // exactMatch
        );
        return res;
    }

    getUIDSearchIndividual = async (
        searchTerm,
        collectionUID,
        page = 1,
        pageSize = 10,
    ) => {
        const res = await this.executeSearchQueryService.executeSearchQuery(
            uidSearchQuery,
            countUIDSearchQuery,
            searchTerm,
            [1225],
            [],
            collectionUID,
            page,
            pageSize,
            false, // exactMatch
        );
        return res;
    };
}
