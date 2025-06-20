"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ArchivistSocketClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchivistSocketClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const socket_io_client_1 = require("socket.io-client");
const websocket_contracts_1 = require("@relica/websocket-contracts");
let ArchivistSocketClient = ArchivistSocketClient_1 = class ArchivistSocketClient {
    configService;
    socket = null;
    logger = new common_1.Logger(ArchivistSocketClient_1.name);
    pendingRequests = new Map();
    messageCounter = 0;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        // Try to connect but don't fail startup if services aren't ready
        this.connect().catch(err => {
            this.logger.warn(`Could not connect to archivist on startup: ${err.message}`);
            this.logger.warn(`Will retry when first request is made`);
        });
    }
    async onModuleDestroy() {
        this.disconnect();
    }
    async connect() {
        if (this.socket?.connected) {
            return;
        }
        const host = this.configService.get('ARCHIVIST_HOST', 'localhost');
        const port = this.configService.get('ARCHIVIST_PORT', 3002);
        const url = `ws://${host}:${port}`;
        this.socket = (0, socket_io_client_1.io)(url, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            // parser: customParser, // Use msgpack parser for better performance
        });
        this.setupEventHandlers();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Failed to connect to archivist service'));
            }, 5000);
            this.socket.on('connect', () => {
                clearTimeout(timeout);
                this.logger.log(`Connected to archivist service at ${url}`);
                resolve();
            });
            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                this.logger.error('Failed to connect to archivist service:', error);
                reject(error);
            });
            this.socket.connect();
        });
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.logger.log('Disconnected from archivist service');
        }
    }
    setupEventHandlers() {
        if (!this.socket)
            return;
        this.socket.on('disconnect', () => {
            this.logger.warn('Disconnected from archivist service');
        });
        this.socket.on('reconnect', () => {
            this.logger.log('Reconnected to archivist service');
        });
        this.socket.on('error', (error) => {
            this.logger.error('Archivist service error:', error);
        });
    }
    generateMessageId() {
        // return `archivist-${Date.now()}-${++this.messageCounter}`;
        // generate valid uuid
        return crypto.randomUUID();
    }
    async sendMessage(action, payload) {
        if (!this.socket?.connected) {
            this.logger.log('Not connected to archivist, attempting to connect...');
            try {
                await this.connect();
            }
            catch (error) {
                throw new Error(`Failed to connect to archivist service: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Create proper request message structure per WebSocket contracts
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action,
            payload,
        };
        // Validate message against contract in development mode
        if (process.env.NODE_ENV === 'development') {
            const validation = websocket_contracts_1.ContractUtils.dev.validate.request(action, message);
            if (!validation.success) {
                this.logger.warn(`Contract validation failed for action ${action}:`, 'error' in validation ? validation.error : 'Unknown validation error');
            }
        }
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout for archivist service'));
            }, 30000);
            this.socket.emit(action, message, (response) => {
                clearTimeout(timeout);
                if (response && response.success === false) {
                    reject(new Error(response.error || 'Request failed'));
                }
                else {
                    resolve(response?.data || response);
                }
            });
        });
    }
    // =====================================================
    // FACT OPERATIONS
    // =====================================================
    async getFact(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET, payload);
    }
    async getFacts(factUIDs) {
        // For multiple facts, make multiple calls or use batch operation
        const promises = factUIDs.map(uid => this.getFact(uid));
        return Promise.all(promises);
    }
    async createFact(fact) {
        return this.sendMessage(websocket_contracts_1.FactActions.CREATE, fact);
    }
    async deleteFact(factUid) {
        const payload = { fact_uid: factUid };
        return this.sendMessage(websocket_contracts_1.FactActions.DELETE, payload);
    }
    async getSubtypes(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET_SUBTYPES, payload);
    }
    async getSubtypesCone(uid) {
        const payload = { uid, includeSubtypes: true };
        return this.sendMessage(websocket_contracts_1.FactActions.GET_SUBTYPES, payload);
    }
    async getSupertypes(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET_SUPERTYPES, payload);
    }
    async getSpecializationHierarchy(uidOrUserId, uid) {
        // Support both signatures:
        // getSpecializationHierarchy(uid: number) - original
        // getSpecializationHierarchy(userId: number, uid: number) - Aperture style
        if (uid !== undefined) {
            // Aperture-style call with userId
            const payload = { uid, 'user-id': uidOrUserId };
            return this.sendMessage(websocket_contracts_1.SpecializationActions.SPECIALIZATION_HIERARCHY_GET, payload);
        }
        else {
            // Original style call with just uid
            const payload = { uid: uidOrUserId };
            return this.sendMessage(websocket_contracts_1.FactActions.GET_SUPERTYPES, payload);
        }
    }
    async getSpecializationFact(userId, uid) {
        const payload = { uid, 'user-id': userId };
        return this.sendMessage(websocket_contracts_1.SpecializationActions.SPECIALIZATION_FACT_GET, payload);
    }
    async getClassified(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET_CLASSIFIED, payload);
    }
    async getClassificationFact(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET_CLASSIFIED, payload);
    }
    async retrieveAllFacts(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET, payload);
    }
    async getDefinitiveFacts(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.FactActions.GET, payload);
    }
    async getFactsRelatingEntities(uid1, uid2) {
        const payload = { query: `relating:${uid1}:${uid2}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async createKind(parentUID, parentName, name, definition) {
        const payload = {
            lh_object_uid: 1, // temporary UID will be assigned by system
            rh_object_uid: parentUID,
            rel_type_uid: 1146, // specialization relationship
            lh_object_name: name,
            rh_object_name: parentName,
            rel_type_name: 'is a specialization of',
            full_definition: definition,
        };
        return this.sendMessage(websocket_contracts_1.FactActions.CREATE, payload);
    }
    async createIndividual(kindUID, kindName, name, definition) {
        const payload = {
            lh_object_uid: 1, // temporary UID will be assigned by system
            rh_object_uid: kindUID,
            rel_type_uid: 1225, // classification relationship
            lh_object_name: name,
            rh_object_name: kindName,
            rel_type_name: 'is classified as a',
            full_definition: definition,
        };
        return this.sendMessage(websocket_contracts_1.FactActions.CREATE, payload);
    }
    // =====================================================
    // ENTITY OPERATIONS
    // =====================================================
    async getEntity(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.ConceptActions.GET, payload);
    }
    async getCategory(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.ConceptActions.GET, payload);
    }
    async getEntityType(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.ConceptActions.GET, payload);
    }
    async deleteEntity(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.ConceptActions.DELETE, payload);
    }
    async resolveUIDs(uids) {
        const payload = { uids };
        return this.sendMessage(websocket_contracts_1.EntityActions.BATCH_RESOLVE, payload);
    }
    async getEntityCollections() {
        const payload = {};
        return this.sendMessage(websocket_contracts_1.EntityActions.COLLECTIONS_GET, payload);
    }
    // =====================================================
    // KIND OPERATIONS
    // =====================================================
    async getKinds() {
        const payload = {};
        return this.sendMessage(websocket_contracts_1.KindActions.LIST, payload);
    }
    async getKindsList(sortField = 'lh_object_name', sortOrder = 'ASC', skip = 0, pageSize = 10, filters = {}) {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Fetching kinds with filters:', { sortField, sortOrder, skip, pageSize, filters });
        const payload = {
            filters: {
                sort: [sortField, sortOrder],
                range: [skip, pageSize],
                filter: filters
            }
        };
        console.log('#####', payload);
        return this.sendMessage(websocket_contracts_1.KindActions.LIST, payload);
    }
    // =====================================================
    // SEARCH OPERATIONS
    // =====================================================
    async searchText(query, collectionUID, limit, offset, searchFilter) {
        // Convert offset to page number (1-based)
        const page = offset ? Math.floor(offset / (limit || 20)) + 1 : 1;
        const payload = {
            searchTerm: query,
            collectionUID,
            page,
            pageSize: limit || 20,
            filter: searchFilter
        };
        return this.sendMessage(websocket_contracts_1.SearchActions.GENERAL, payload);
    }
    async textSearch(params) {
        const payload = {
            query: params.searchTerm,
            filters: { exactMatch: params.exactMatch }
        };
        return this.sendMessage(websocket_contracts_1.SearchActions.GENERAL, payload);
    }
    async textSearchExact(searchTerm) {
        const payload = {
            query: searchTerm,
            filters: { exactMatch: true }
        };
        return this.sendMessage(websocket_contracts_1.SearchActions.GENERAL, payload);
    }
    async searchUid(uid) {
        const payload = { uid };
        return this.sendMessage(websocket_contracts_1.SearchActions.UID, payload);
    }
    async uidSearch(params) {
        return this.sendMessage(websocket_contracts_1.SearchActions.UID, params);
    }
    // =====================================================
    // SUBMISSION OPERATIONS
    // =====================================================
    async submitFact(factData) {
        return this.sendMessage(websocket_contracts_1.SubmissionActions.SUBMIT, { facts: [factData] });
    }
    async submitDefinition(fact_uid, partial_definition, full_definition) {
        const payload = {
            uid: fact_uid,
            definition: {
                partial_definition,
                full_definition,
            }
        };
        return this.sendMessage(websocket_contracts_1.DefinitionActions.UPDATE, payload);
    }
    async submitCollection(fact_uid, collection_uid, collection_name) {
        const payload = {
            facts: [{
                    lh_object_uid: fact_uid,
                    rh_object_uid: collection_uid,
                    rel_type_uid: 1, // Placeholder - would need appropriate relation type
                    collection_name,
                }],
            metadata: { type: 'collection_update' }
        };
        return this.sendMessage(websocket_contracts_1.SubmissionActions.SUBMIT, payload);
    }
    async submitName(fact_uid, name) {
        const payload = {
            facts: [{
                    lh_object_uid: fact_uid,
                    rh_object_uid: 1, // Placeholder - entity being named
                    rel_type_uid: 1, // Placeholder - would need appropriate relation type
                    name,
                }],
            metadata: { type: 'name_update' }
        };
        return this.sendMessage(websocket_contracts_1.SubmissionActions.SUBMIT, payload);
    }
    // =====================================================
    // SPECIALIZED OPERATIONS (from Aperture implementation)
    // =====================================================
    async getAllRelated(entityUid) {
        const payload = { query: `related:${entityUid}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async getRecursiveRelations(entityUid, relTypeUid) {
        const payload = { query: `recursive:${entityUid}:${relTypeUid}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async getRecursiveRelationsTo(entityUid, relTypeUid) {
        const payload = { query: `recursiveTo:${entityUid}:${relTypeUid}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async getRequiredRoles(relTypeUid) {
        const payload = { query: `requiredRoles:${relTypeUid}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async getRolePlayers(relTypeUid) {
        const payload = { query: `rolePlayers:${relTypeUid}` };
        return this.sendMessage(websocket_contracts_1.QueryActions.EXECUTE, payload);
    }
    async getRelatedOnUIDSubtypeCone(lh_object_uid, rel_type_uid) {
        const payload = {
            uid: lh_object_uid,
            includeSubtypes: true,
            maxDepth: 10, // reasonable default for cone searches
        };
        return this.sendMessage(websocket_contracts_1.FactActions.GET, payload);
    }
    // =====================================================
    // CONNECTION UTILITIES
    // =====================================================
    isConnected() {
        return this.socket?.connected || false;
    }
    async ensureConnected() {
        if (!this.isConnected()) {
            await this.connect();
        }
    }
    async getFactsBatch(config) {
        return this.sendMessage(websocket_contracts_1.FactActions.BATCH_GET, config);
    }
    async getEntityLineageViaEndpoint(entityUid) {
        return this.sendMessage(websocket_contracts_1.LineageActions.GET, { uid: entityUid });
    }
};
exports.ArchivistSocketClient = ArchivistSocketClient;
exports.ArchivistSocketClient = ArchivistSocketClient = ArchivistSocketClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ArchivistSocketClient);
//# sourceMappingURL=ArchivistSocketClient.js.map