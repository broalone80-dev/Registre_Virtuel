/**
 * CONFIGURATION SWAGGER/OPENAPI
 * Documentation automatique de l'API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Registre Virtuel EU - API',
            version: '1.0.0',
            description: 'API complète de gestion de matériel informatique avec workflow de maintenance',
            contact: {
                name: 'Arnaud',
                email: 'arnaud@expressunion.cm',
                url: 'https://expressunion.cm'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server'
            },
            {
                url: 'https://api.registre-virtuel.eu',
                description: 'Production Server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Authorization header using Bearer scheme'
                }
            },
            schemas: {
                // User
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['super_admin', 'admin', 'manager', 'technician', 'receptionist'] },
                        is_active: { type: 'boolean' },
                        agency_id: { type: 'string', format: 'uuid' },
                        last_login_at: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Agency
                Agency: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        code: { type: 'string' },
                        name: { type: 'string' },
                        address: { type: 'string' },
                        city: { type: 'string' },
                        region: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Depositor
                Depositor: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        company_name: { type: 'string' },
                        is_vip: { type: 'boolean' },
                        total_deposits: { type: 'integer' },
                        agency_id: { type: 'string', format: 'uuid' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Equipment
                Equipment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        reference: { type: 'string' },
                        brand: { type: 'string' },
                        model: { type: 'string' },
                        serial_number: { type: 'string' },
                        status: { 
                            type: 'string',
                            enum: ['received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval', 'waiting_parts', 'in_repair', 'quality_check', 'repaired', 'unrepairable', 'waiting_pickup', 'delivered', 'archived']
                        },
                        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
                        problem_description: { type: 'string' },
                        agency_id: { type: 'string', format: 'uuid' },
                        depositor_id: { type: 'string', format: 'uuid' },
                        type_id: { type: 'string', format: 'uuid' },
                        received_at: { type: 'string', format: 'date-time' },
                        delivered_at: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Diagnostic
                Diagnostic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        equipment_id: { type: 'string', format: 'uuid' },
                        technician_id: { type: 'string', format: 'uuid' },
                        fault_type: { type: 'string' },
                        fault_description: { type: 'string' },
                        result: { type: 'string', enum: ['repairable', 'unrepairable', 'needs_parts', 'pending'] },
                        estimated_cost: { type: 'number' },
                        estimated_hours: { type: 'number' },
                        customer_approved: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Intervention
                Intervention: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        equipment_id: { type: 'string', format: 'uuid' },
                        diagnostic_id: { type: 'string', format: 'uuid' },
                        technician_id: { type: 'string', format: 'uuid' },
                        status: { type: 'string', enum: ['pending', 'in_progress', 'paused', 'completed', 'cancelled'] },
                        actions_performed: { type: 'string' },
                        total_duration_minutes: { type: 'integer' },
                        quality_check_passed: { type: 'boolean' },
                        satisfaction_rating: { type: 'integer', minimum: 1, maximum: 5 },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },

                // Error Response
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        error: { type: 'string' }
                    }
                },

                // Success Response
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: [
        './src/routes/authRoutes.js',
        './src/routes/agencyRoutes.js',
        './src/routes/userRoutes.js',
        './src/routes/depositorRoutes.js',
        './src/routes/equipmentRoutes.js',
        './src/routes/diagnosticRoutes.js',
        './src/routes/interventionRoutes.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

