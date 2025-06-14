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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModellingService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const modellingSession_entity_1 = require("./modellingSession.entity");
const workflowDefs_1 = require("./workflows/workflowDefs");
const workflowManager_1 = require("./workflows/workflowManager");
let ModellingService = class ModellingService {
    async onApplicationBootstrap() {
        const state = await this.modelSessionRepository.find({
            where: { uid: 1 },
        });
    }
    constructor(modelSessionRepository) {
        this.modelSessionRepository = modelSessionRepository;
        this.logger = new common_2.Logger('ModellingService');
        this.workflows = {};
        this.workflows = workflowDefs_1.workflowDefs;
    }
    get stack() {
        const stack = [];
        let current = this.current;
        while (current) {
            stack.unshift(current.id);
            current = current.parent;
        }
        return stack;
    }
    getState() {
        return {
            environment: [],
            stack: this.stack,
            tree: this.root?.tree,
            workflow: this.current?.state,
            isComplete: false,
            context: this.current?.context,
            facts: this.root?.facts,
        };
    }
    async getWorkflows() {
        return this.workflows;
    }
    async initWorkflow(workflowId) {
        const workflow = this.workflows[workflowId];
        const manager = new workflowManager_1.default(workflow);
        this.root = manager;
        this.current = manager;
        return manager.start({ fieldId: null, entity: null });
    }
    async branchWorkflow(fieldId, workflowId) {
        const currentManager = this.current;
        if (currentManager.children[fieldId]) {
            this.current = currentManager.children[fieldId];
        }
        else {
            const workflow = this.workflows[workflowId];
            const manager = new workflowManager_1.default(workflow);
            currentManager.children[fieldId] = manager;
            manager.parent = currentManager;
            this.current = manager;
            const fieldDef = currentManager.currentStep.fieldSources.filter((field) => field.field === fieldId)[0];
            const entity = currentManager.context[fieldId];
            return this.current.start({ fieldDef, entity });
        }
    }
    incrementWorkflowStep() {
        return this.current.next();
    }
    decrementWorkflowStep() {
        return this.current.prev();
    }
    validateWorkflow() {
        this.current.validate();
    }
    finalizeWorkflow() {
        this.root.finalize();
    }
    popWorkflow() {
        if (this.current.parent) {
            this.current = this.current.parent;
        }
    }
    setWorkflowValue(key, value) {
        this.current.setContext(key, { uid: null, value });
    }
    setWorkflowKGValue(key, uid, value) {
        this.current.setContext(key, { uid, value });
    }
};
exports.ModellingService = ModellingService;
exports.ModellingService = ModellingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(modellingSession_entity_1.ModellingSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ModellingService);
//# sourceMappingURL=modelling.service.js.map