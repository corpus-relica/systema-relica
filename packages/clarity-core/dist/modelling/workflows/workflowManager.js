"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStatus = void 0;
const stepDefs_1 = require("./stepDefs");
const UIDManager_1 = require("./UIDManager");
const _ = require("lodash");
const omitEmptyValues = (obj) => {
    return _.omitBy(obj, (value) => _.isNil(value) || value === '');
};
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["NOT_STARTED"] = "not-started";
    WorkflowStatus["IN_PROGRESS"] = "in-progress";
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["COMPLETED"] = "completed";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
const emptyFactsP = (facts) => {
    return facts.every((fact) => {
        return (fact.lh_object_name === '' &&
            fact.rh_object_name === '');
    });
};
const completeFactsP = (facts) => {
    return facts.every((fact) => {
        return (fact.lh_object_name !== '' &&
            fact.rh_object_name !== '');
    });
};
const someCompleteFactsP = (facts) => {
    return facts.some((fact) => {
        return (fact.lh_object_name !== '' &&
            fact.rh_object_name !== '');
    });
};
class WorkflowManager {
    constructor(def) {
        this._def = {};
        this._context = {};
        this.currStepIdx = 0;
        this.currStepDef = {};
        this.status = WorkflowStatus.NOT_STARTED;
        this._parent = null;
        this._children = {};
        this._id = Math.floor(10000 + Math.random() * 90000);
        this._def = Object.assign({}, def);
    }
    get id() {
        return this._id + ':' + this._def.id;
    }
    get def() {
        return this._def;
    }
    get currentStep() {
        return this.currStepDef;
    }
    get isFinalStep() {
        return this.currStepIdx === this.def.steps.length - 1;
    }
    get isRequiredStep() {
        return this.def.steps[this.currStepIdx].required;
    }
    get state() {
        return {
            id: this.id,
            currentStep: this.currentStep,
            isFinalStep: this.isFinalStep,
            status: this.status,
        };
    }
    get steps() {
        return this.def.steps;
    }
    get tree() {
        const tree = [];
        const stack = [this];
        while (stack.length > 0) {
            const node = stack.pop();
            for (const childId in node.children) {
                tree.push([node.children[childId].id, node.id]);
                stack.push(node.children[childId]);
            }
        }
        return tree;
    }
    get context() {
        const thisCtx = this._context;
        console.log('GETTING CONTEXT', this.id, thisCtx);
        if (this._parent) {
            const parentCtx = this._parent.context;
            console.log('PARENT CONTEXT', this.id, parentCtx);
            const keys = Array.from(new Set([...Object.keys(thisCtx), ...Object.keys(parentCtx)]));
            const ctx = keys.reduce((acc, key) => {
                const thisEnt = thisCtx[key];
                const parentEnt = parentCtx[key];
                if (thisEnt && parentEnt) {
                    if (thisEnt.value !== '') {
                        acc[key] = thisEnt;
                    }
                    else if (parentEnt.value !== '') {
                        acc[key] = parentEnt;
                    }
                    else {
                        acc[key] = thisEnt;
                    }
                }
                else if (thisEnt) {
                    acc[key] = thisEnt;
                }
                else if (parentEnt) {
                    acc[key] = parentEnt;
                }
                return acc;
            }, {});
            console.log('KEYS', keys);
            console.log('RETURNING CONTEXT', this.id, ctx);
            return ctx;
        }
        console.log('RETURNING CONTEXT BASE', this.id, this._context);
        return this._context;
    }
    get parent() {
        return this._parent;
    }
    set parent(parent) {
        this._parent = parent;
    }
    get children() {
        return this._children;
    }
    fuckit(pattern) {
        const facts = [];
        pattern.forEach((expression) => {
            if (expression.startsWith('@'))
                return;
            const parts = expression
                .split('>')
                .map((e) => e.trim())
                .map((e) => {
                const [id, name] = e.split('.');
                const newName = name.endsWith('*') || name.endsWith('+')
                    ? name.substring(0, name.length - 1)
                    : name;
                return [id, newName];
            });
            console.log('PARS', parts);
            let lh_object_uid = parts[0][0];
            let lh_object_name = parts[0][1];
            let rh_object_uid = parts[2][0];
            let rh_object_name = parts[2][1];
            if (lh_object_uid.startsWith('?')) {
                const lh_object = this.getContext(lh_object_name);
                lh_object_uid = lh_object?.uid;
                lh_object_name = lh_object?.value;
            }
            if (rh_object_uid.startsWith('?')) {
                const rh_object = this.getContext(rh_object_name);
                rh_object_uid = rh_object?.uid;
                rh_object_name = rh_object?.value;
            }
            const fact = {
                fact_uid: 1,
                lh_object_uid,
                lh_object_name,
                rel_type_uid: parts[1][0],
                rel_type_name: parts[1][1],
                rh_object_uid,
                rh_object_name,
            };
            facts.push(fact);
        });
        return facts;
    }
    get facts() {
        const facts = [];
        for (const step of this.steps) {
            const f = this.fuckit(stepDefs_1.stepDefs[step.id].create);
            console.log('FACT', f);
            if (step.required) {
                facts.push(...f);
            }
            else {
                if (someCompleteFactsP(f)) {
                    f.forEach((fact) => {
                        if (completeFactsP([fact])) {
                            facts.push(fact);
                        }
                    });
                }
            }
        }
        for (const childId in this.children) {
            facts.push(...this.children[childId].facts);
        }
        const foo = {};
        facts.forEach((f) => {
            const key = `${f.lh_object_uid}:${f.lh_object_name}:${f.rel_type_uid}:${f.rh_object_uid}:${f.rh_object_name}`;
            if (!foo[key])
                foo[key] = f;
        });
        return Object.values(foo);
    }
    areAllFieldsValid() {
        return true;
    }
    start(linkedField) {
        const { fieldDef, entity } = linkedField;
        const thatFieldId = fieldDef?.thatField;
        this.currStepIdx = 0;
        this.currStepDef = stepDefs_1.stepDefs[this.def.steps[this.currStepIdx].id];
        this.status = WorkflowStatus.IN_PROGRESS;
        Object.entries(stepDefs_1.stepDefs).forEach(([key, val]) => {
            val.fieldSources.forEach((field) => {
                if (!this._context[field.field]) {
                    if (field.field === thatFieldId) {
                        this._context[field.field] = entity;
                    }
                    else {
                        const uid = UIDManager_1.default.getNextUID();
                        this._context[field.field] = {
                            uid,
                            value: '',
                        };
                    }
                }
            });
        });
        return this.currStepDef;
    }
    next() {
        this.currStepIdx++;
        this.currStepDef = stepDefs_1.stepDefs[this.def.steps[this.currStepIdx].id];
        return this.currStepDef;
    }
    prev() {
        if (this.currStepIdx === 0)
            return this.currStepDef;
        this.currStepIdx--;
        this.currStepDef = stepDefs_1.stepDefs[this.def.steps[this.currStepIdx].id];
        return this.currStepDef;
    }
    validate() {
        if (this.areAllFieldsValid()) {
            this.status = WorkflowStatus.PENDING;
        }
        else {
            throw new Error('All required fields must be valid to validate the workflow');
        }
    }
    finalize() {
        if (this.status !== WorkflowStatus.PENDING) {
            throw new Error("Workflow must be in 'pending' status to finalize");
        }
        this.status = WorkflowStatus.COMPLETED;
    }
    setContext(key, value) {
        console.log('SETTING CONTEXT', this.id, key, value);
        if (value.uid) {
            this._context[key].uid = value.uid;
        }
        if (value.value) {
            this._context[key].value = value.value;
        }
    }
    getContext(key) {
        if (this._context[key]) {
            return this._context[key];
        }
        if (this._parent) {
            return this._parent.getContext(key);
        }
        return null;
    }
}
exports.default = WorkflowManager;
//# sourceMappingURL=workflowManager.js.map