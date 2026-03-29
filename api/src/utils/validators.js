/**
 * SCHÉMAS DE VALIDATION JOI
 */

const Joi = require('joi');

// ============================================
// AUTH
// ============================================

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email invalide',
        'any.required': 'Email requis'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mot de passe minimum 6 caractères',
        'any.required': 'Mot de passe requis'
    }),
    first_name: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Prénom requis'
    }),
    last_name: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Nom requis'
    }),
    phone: Joi.string().allow('', null),
    role: Joi.string().valid('admin', 'manager', 'technician', 'receptionist').default('receptionist'),
    agency_id: Joi.string().uuid().allow('', null).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email invalide',
        'any.required': 'Email requis'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Mot de passe requis'
    })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email invalide',
        'any.required': 'Email requis'
    })
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Token requis'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mot de passe minimum 6 caractères',
        'any.required': 'Mot de passe requis'
    })
});

// ============================================
// AGENCY
// ============================================

const agencySchema = Joi.object({
    code: Joi.string().max(10).required(),
    name: Joi.string().max(100).required(),
    address: Joi.string().allow('', null),
    city: Joi.string().max(50).allow('', null),
    region: Joi.string().max(50).allow('', null),
    postal_code: Joi.string().max(10).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    email: Joi.string().email().allow('', null),
    max_daily_appointments: Joi.number().integer().min(1).default(20)
});

// ============================================
// DEPOSITOR
// ============================================

const depositorSchema = Joi.object({
    first_name: Joi.string().max(50).required(),
    last_name: Joi.string().max(50).required(),
    phone: Joi.string().max(20).required(),
    email: Joi.string().email().allow('', null),
    id_type: Joi.string().max(20).allow('', null),
    id_number: Joi.string().max(50).allow('', null),
    company_name: Joi.string().max(100).allow('', null),
    company_role: Joi.string().max(50).allow('', null),
    agency_id: Joi.string().uuid().required()
});

// ============================================
// EQUIPMENT
// ============================================

const equipmentSchema = Joi.object({
    type_id: Joi.string().uuid().allow('', null),
    equipment_type: Joi.string().max(100).allow('', null),
    agency_id: Joi.string().uuid().required(),
    depositor_id: Joi.string().uuid().allow('', null),
    depositor_name: Joi.string().max(100).allow('', null),
    depositor_phone: Joi.string().max(20).allow('', null),
    brand: Joi.string().max(50).allow('', null),
    model: Joi.string().max(100).allow('', null),
    serial_number: Joi.string().max(100).allow('', null),
    problem_description: Joi.string().required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    accessories: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
    ).allow(null)
});

const equipmentStatusSchema = Joi.object({
    status: Joi.string().valid(
        'received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval',
        'waiting_parts', 'in_repair', 'quality_check', 'repaired',
        'unrepairable', 'waiting_pickup', 'delivered', 'archived',
        'replaced', 'exchanged', 'transferred', 'in_transit'
    ).required()
});

// ============================================
// DIAGNOSTIC
// ============================================

const diagnosticSchema = Joi.object({
    equipment_id: Joi.string().uuid().required(),
    fault_type: Joi.string().max(100).allow('', null),
    fault_description: Joi.string().required(),
    tests_performed: Joi.array().items(Joi.object({
        test: Joi.string().required(),
        result: Joi.string().required()
    })).allow(null),
    result: Joi.string().valid('repairable', 'unrepairable', 'needs_parts', 'pending', 'to_replace', 'to_exchange').default('pending'),
    estimated_cost: Joi.number().precision(2).allow(null),
    estimated_hours: Joi.number().precision(2).allow(null),
    notes: Joi.string().allow('', null)
});

// ============================================
// INTERVENTION
// ============================================

const interventionSchema = Joi.object({
    equipment_id: Joi.string().uuid().required(),
    diagnostic_id: Joi.string().uuid().allow(null),
    technician_id: Joi.string().uuid().allow('', null),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    actions_performed: Joi.string().required(),
    parts_used: Joi.array().items(Joi.object({
        part_id: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        cost: Joi.number().precision(2)
    })).allow(null),
    result_notes: Joi.string().allow('', null),
    estimated_duration: Joi.string().allow('', null),
    estimated_cost: Joi.alternatives().try(
        Joi.number().precision(2),
        Joi.string()
    ).allow('', null),
    expertise_notes: Joi.string().allow('', null),
    status: Joi.string().valid('pending', 'in_progress', 'paused', 'completed', 'cancelled').default('pending')
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    agencySchema,
    depositorSchema,
    equipmentSchema,
    equipmentStatusSchema,
    diagnosticSchema,
    interventionSchema
};
