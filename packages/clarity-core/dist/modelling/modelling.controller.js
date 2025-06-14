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
var ModellingController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModellingController = void 0;
const common_1 = require("@nestjs/common");
const modelling_service_1 = require("./modelling.service");
let ModellingController = ModellingController_1 = class ModellingController {
    constructor(modelling) {
        this.modelling = modelling;
        this.logger = new common_1.Logger(ModellingController_1.name);
    }
    async workflows() {
        this.logger.log('~~~~~~~~~~~~GET WORKFLOWS~~~~~~~~~~~~');
        try {
            return this.modelling.getWorkflows();
        }
        catch (e) {
            this.logger.error('Error getting workflows:', e);
            throw new common_1.HttpException('Error getting workflows', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async state() {
        this.logger.log('~~~~~~~~~~~~GET STATE~~~~~~~~~~~~');
        try {
            return this.modelling.getState();
        }
        catch (e) {
            this.logger.error('Error getting state:', e);
            throw new common_1.HttpException('Error getting state', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async initWorkflow(workflowId) {
        this.logger.log('~~~~~~~~~~~~INIT WORKFLOW~~~~~~~~~~~~');
        try {
            return this.modelling.initWorkflow(workflowId);
        }
        catch (e) {
            this.logger.error('Error initializing workflow:', e);
            throw new common_1.HttpException('Error initializing workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async branchWorkflow(fieldId, workflowId) {
        this.logger.log('~~~~~~~~~~~~BRANCH WORKFLOW~~~~~~~~~~~~');
        try {
            return this.modelling.branchWorkflow(fieldId, workflowId);
        }
        catch (e) {
            this.logger.error('Error branching workflow:', e);
            throw new common_1.HttpException('Error branching workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async incrementWorkflowStep(workflowId) {
        this.logger.log('~~~~~~~~~~~~INCREMENT WORKFLOW STEP~~~~~~~~~~~~');
        try {
            return this.modelling.incrementWorkflowStep();
        }
        catch (e) {
            this.logger.error('Error incrementing workflow step:', e);
            throw new common_1.HttpException('Error incrementing workflow step', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async decrementWorkflowStep(workflowId) {
        this.logger.log('~~~~~~~~~~~~DECREMENT WORKFLOW STEP~~~~~~~~~~~~');
        try {
            return this.modelling.decrementWorkflowStep();
        }
        catch (e) {
            this.logger.error('Error decrementing workflow step:', e);
            throw new common_1.HttpException('Error decrementing workflow step', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateWorkflow() {
        this.logger.log('~~~~~~~~~~~~VALIDATE WORKFLOW~~~~~~~~~~~~');
        try {
            return this.modelling.validateWorkflow();
        }
        catch (e) {
            this.logger.error('Error validating workflow:', e);
            throw new common_1.HttpException('Error validating workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async finalizeWorkflow() {
        this.logger.log('~~~~~~~~~~~~FINALIZE WORKFLOW~~~~~~~~~~~~');
        try {
            return this.modelling.finalizeWorkflow();
        }
        catch (e) {
            this.logger.error('Error finalizing workflow:', e);
            throw new common_1.HttpException('Error finalizing workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async popWorkflow() {
        this.logger.log('~~~~~~~~~~~~POP WORKFLOW~~~~~~~~~~~~');
        try {
            return this.modelling.popWorkflow();
        }
        catch (e) {
            this.logger.error('Error poping workflow:', e);
            throw new common_1.HttpException('Error poping workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setWorkflowValue(key, value) {
        this.logger.log('~~~~~~~~~~~~SET WORKFLOW VALUE~~~~~~~~~~~~');
        try {
            return this.modelling.setWorkflowValue(key, value);
        }
        catch (e) {
            this.logger.error('Error setting workflow value:', e);
            throw new common_1.HttpException('Error setting workflow value', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setWorkflowKGValue(key, uid, value) {
        this.logger.log('~~~~~~~~~~~~SET WORKFLOW KG VALUE~~~~~~~~~~~~');
        try {
            return this.modelling.setWorkflowKGValue(key, +uid, value);
        }
        catch (e) {
            this.logger.error('Error setting workflow value:', e);
            throw new common_1.HttpException('Error setting workflow value', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ModellingController = ModellingController;
__decorate([
    (0, common_1.Get)('/workflows'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "workflows", null);
__decorate([
    (0, common_1.Get)('/state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "state", null);
__decorate([
    (0, common_1.Get)('/workflow/init/:workflowId'),
    __param(0, (0, common_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "initWorkflow", null);
__decorate([
    (0, common_1.Get)('/workflow/branch/:fieldId/:workflowId'),
    __param(0, (0, common_1.Param)('fieldId')),
    __param(1, (0, common_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "branchWorkflow", null);
__decorate([
    (0, common_1.Get)('workflow/increment/:workflowId'),
    __param(0, (0, common_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "incrementWorkflowStep", null);
__decorate([
    (0, common_1.Get)('workflow/decrement/:workflowId'),
    __param(0, (0, common_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "decrementWorkflowStep", null);
__decorate([
    (0, common_1.Get)('workflow/validate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "validateWorkflow", null);
__decorate([
    (0, common_1.Get)('workflow/finalize'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "finalizeWorkflow", null);
__decorate([
    (0, common_1.Get)('workflow/pop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "popWorkflow", null);
__decorate([
    (0, common_1.Get)('workflow/setValue/:key/:value'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Param)('value')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "setWorkflowValue", null);
__decorate([
    (0, common_1.Get)('workflow/setKGValue/:key/:uid/:value'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Param)('uid')),
    __param(2, (0, common_1.Param)('value')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ModellingController.prototype, "setWorkflowKGValue", null);
exports.ModellingController = ModellingController = ModellingController_1 = __decorate([
    (0, common_1.Controller)('modelling'),
    __metadata("design:paramtypes", [typeof (_a = typeof modelling_service_1.ModellingService !== "undefined" && modelling_service_1.ModellingService) === "function" ? _a : Object])
], ModellingController);
//# sourceMappingURL=modelling.controller.js.map