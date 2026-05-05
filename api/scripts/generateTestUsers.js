#!/usr/bin/env node
/**
 * SCRIPT: Générer 3 utilisateurs de test avec leurs tokens
 * Usage: node scripts/generateTestUsers.js
 */

require('dotenv').config({ path: '.env' });
const { User } = require('../src/models');
const { generateToken } = require('../src/middlewares/auth');
const sequelize = require('../src/models').sequelize;

const testUsers = [
    {
        email: 'admin@registre-virtuel.eu',
        password: 'Admin123!',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        phone: '+33600000001'
    },
    {
        email: 'technician@registre-virtuel.eu',
        password: 'Tech123!',
        first_name: 'Jean',
        last_name: 'Technicien',
        role: 'technician',
        phone: '+33600000002'
    },
    {
        email: 'manager@registre-virtuel.eu',
        password: 'Manager123!',
        first_name: 'Marie',
        last_name: 'Manager',
        role: 'manager',
        phone: '+33600000003'
    }
];

const generateUsers = async () => {
    try {
        console.log('🔄 Connexion à la base de données...');
        await sequelize.authenticate();
        console.log('✅ Connexion réussie\n');

        console.log('🔐 Génération des utilisateurs de test...\n');

        const results = [];

        for (const userData of testUsers) {
            try {
                // Vérifier si l'utilisateur existe déjà
                let user = await User.findOne({ where: { email: userData.email } });

                if (!user) {
                    user = await User.create(userData);
                    console.log(`✅ Créé: ${userData.email}`);
                } else {
                    console.log(`⚠️  Existe déjà: ${userData.email}`);
                }

                // Générer le token
                const token = generateToken(user.id);

                results.push({
                    email: userData.email,
                    password: userData.password,
                    role: userData.role,
                    token: token,
                    fullName: `${userData.first_name} ${userData.last_name}`
                });
            } catch (err) {
                console.error(`❌ Erreur création ${userData.email}:`, err.message);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📋 IDENTIFIANTS DE TEST\n');
        
        results.forEach((user, idx) => {
            console.log(`\n🔑 UTILISATEUR ${idx + 1}`);
            console.log('─'.repeat(80));
            console.log(`  📧 Email    : ${user.email}`);
            console.log(`  🔐 Password : ${user.password}`);
            console.log(`  👤 Rôle    : ${user.role}`);
            console.log(`  👤 Nom     : ${user.fullName}`);
            console.log(`\n  🎫 TOKEN JWT:`);
            console.log(`  ${user.token}`);
            console.log('─'.repeat(80));
        });

        console.log('\n✅ Utilisateurs générés avec succès!\n');

        // Afficher les instructions
        console.log('📝 INSTRUCTIONS SWAGGER:');
        console.log('1. Lance l\'API: npm run dev');
        console.log('2. Ouvre Swagger: http://localhost:5000/api-docs');
        console.log('3. Clique sur "Authorize" 🔒');
        console.log('4. Copie un token ci-dessus');
        console.log('5. Colle-le avec "Bearer " devant\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        process.exit(1);
    }
};

generateUsers();
