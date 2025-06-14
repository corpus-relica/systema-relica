"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TempUIDManager {
    static getNextUID() {
        this.currentId += 1;
        return this.currentId;
    }
    static reset() {
        this.currentId = 0;
    }
}
TempUIDManager.currentId = 0;
exports.default = TempUIDManager;
//# sourceMappingURL=UIDManager.js.map