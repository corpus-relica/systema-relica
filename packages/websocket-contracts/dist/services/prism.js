"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismResponseSchema = exports.PrismRequestSchema = exports.PrismEvents = exports.PrismActions = exports.SetupStatusBroadcastEventSchema = exports.ResetSystemResponseSchema = exports.ResetSystemRequestSchema = exports.GetSetupStatusResponseSchema = exports.GetSetupStatusRequestSchema = exports.SetupStatusSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../base");
// =====================================================
// PRISM SETUP STATUS CONTRACT - Our Seed Example
// =====================================================
/**
 * Setup status data structure
 */
exports.SetupStatusSchema = zod_1.z.object({
    status: zod_1.z.string(),
    stage: zod_1.z.string().nullable(),
    message: zod_1.z.string(),
    progress: zod_1.z.number().min(0).max(100),
    error: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
});
/**
 * Get Setup Status Request
 */
exports.GetSetupStatusRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('prism'),
    action: zod_1.z.literal('setup/get-status'),
    payload: zod_1.z.undefined().optional(), // No payload needed
});
/**
 * Get Setup Status Response
 */
exports.GetSetupStatusResponseSchema = base_1.BaseResponseSchema.extend({
    data: exports.SetupStatusSchema.optional(),
});
// =====================================================
// PRISM RESET SYSTEM CONTRACT
// =====================================================
/**
 * Reset System Request
 */
exports.ResetSystemRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('prism'),
    action: zod_1.z.literal('setup/reset-system'),
    payload: zod_1.z.undefined().optional(),
});
/**
 * Reset System Response
 */
exports.ResetSystemResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        message: zod_1.z.string(),
        errors: zod_1.z.array(zod_1.z.string()).optional(),
        timestamp: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// PRISM SETUP STATUS BROADCAST EVENT
// =====================================================
/**
 * Setup Status Broadcast Event - sent to all connected clients when setup state changes
 */
exports.SetupStatusBroadcastEventSchema = zod_1.z.object({
    type: zod_1.z.literal('setup-status-update'),
    data: exports.SetupStatusSchema,
});
// =====================================================
// PRISM SERVICE ACTIONS
// =====================================================
/**
 * All supported Prism WebSocket topics/actions
 * These are the actual topic strings used by both Portal and Prism
 */
exports.PrismActions = {
    GET_SETUP_STATUS: 'setup/get-status',
    START_SETUP: 'setup/start',
    CREATE_USER: 'setup/create-user',
    IMPORT_DATA: 'setup/import-data',
    RESET_SYSTEM: 'setup/reset-system',
};
/**
 * Prism broadcast events
 */
exports.PrismEvents = {
    SETUP_STATUS_UPDATE: 'setup-status-update',
};
/**
 * Prism request message discriminated union
 */
exports.PrismRequestSchema = zod_1.z.discriminatedUnion('action', [
    exports.GetSetupStatusRequestSchema,
    exports.ResetSystemRequestSchema,
    // Add other Prism requests here as we implement them
]);
/**
 * Prism response message discriminated union
 */
exports.PrismResponseSchema = zod_1.z.union([
    exports.GetSetupStatusResponseSchema,
    exports.ResetSystemResponseSchema,
    // Add other Prism responses here as we implement them
]);
//# sourceMappingURL=prism.js.map