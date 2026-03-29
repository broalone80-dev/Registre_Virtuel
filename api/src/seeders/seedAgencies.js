/**
 * SEEDER — Agences Express Union Cameroun
 * Insère les agences réelles Express Union dans la base de données.
 * 
 * Usage: node src/seeders/seedAgencies.js
 */

const { sequelize } = require('../config/database');
const Agency = require('../models/Agency');
const logger = require('../utils/logger');

const EXPRESS_UNION_AGENCIES = [
    // ============================================
    // REGION CENTRE
    // ============================================
    { code: 'YDE-KEN', name: 'Yaoundé Avenue Kennedy', city: 'Yaoundé', region: 'Centre', address: 'Avenue Kennedy, face Tiger Photo' },
    { code: 'YDE-BYS', name: 'Yaoundé Biyem-Assi', city: 'Yaoundé', region: 'Centre', address: 'Carrefour Biyem-Assi' },
    { code: 'YDE-AWE', name: 'Yaoundé Awae', city: 'Yaoundé', region: 'Centre', address: 'Face Pharmacie La Persévérance' },
    { code: 'YDE-ETM', name: 'Yaoundé Etoa-Meki', city: 'Yaoundé', region: 'Centre', address: 'Rue Onambele Nkou' },
    { code: 'YDE-ODZ', name: 'Yaoundé Odza', city: 'Yaoundé', region: 'Centre', address: 'Carrefour Mvog Abang' },
    { code: 'YDE-ETG', name: 'Yaoundé Etoug-Ebe', city: 'Yaoundé', region: 'Centre', address: 'Face Lycée d\'Etoug-Ebe' },
    { code: 'YDE-MVG', name: 'Yaoundé Mvog-Mbeti', city: 'Yaoundé', region: 'Centre', address: 'Carrefour M.E.E.C.' },
    { code: 'YDE-ETD', name: 'Yaoundé Etoudi Prestige', city: 'Yaoundé', region: 'Centre', address: 'Hôtel Prestige Palace' },
    { code: 'YDE-NLS', name: 'Yaoundé Nlong-Assi', city: 'Yaoundé', region: 'Centre', address: 'Carrefour Nlong-Assi' },
    { code: 'YDE-MKK', name: 'Yaoundé Mokolo', city: 'Yaoundé', region: 'Centre', address: 'Marché Mokolo' },
    { code: 'YDE-ESK', name: 'Yaoundé Essos', city: 'Yaoundé', region: 'Centre', address: 'Carrefour Essos' },
    { code: 'YDE-MFS', name: 'Yaoundé Mfoundi', city: 'Yaoundé', region: 'Centre', address: 'Place de la Réunification' },
    { code: 'MBY-001', name: 'Mbalmayo', city: 'Mbalmayo', region: 'Centre', address: 'Centre-ville Mbalmayo' },
    { code: 'MFU-001', name: 'Mfou', city: 'Mfou', region: 'Centre', address: 'Centre-ville Mfou' },
    { code: 'EVD-001', name: 'Evodoula', city: 'Evodoula', region: 'Centre', address: 'Centre-ville Evodoula' },
    { code: 'MTL-001', name: 'Monatélé', city: 'Monatélé', region: 'Centre', address: 'Centre-ville Monatélé' },
    { code: 'NGR-001', name: 'Ngoro', city: 'Ngoro', region: 'Centre', address: 'Centre-ville Ngoro' },

    // ============================================
    // REGION LITTORAL
    // ============================================
    { code: 'DLA-AKW', name: 'Douala Akwa', city: 'Douala', region: 'Littoral', address: 'Face Central Voyages, Akwa' },
    { code: 'DLA-BLB', name: 'Douala Boulevard Liberté', city: 'Douala', region: 'Littoral', address: 'Entre Orange et immeuble Socar' },
    { code: 'DLA-BPC', name: 'Douala BP Cité', city: 'Douala', region: 'Littoral', address: 'Derrière station Total BP Cité' },
    { code: 'DLA-BNB', name: 'Douala Bonabéri', city: 'Douala', region: 'Littoral', address: 'Carrefour Bonabéri' },
    { code: 'DLA-DEI', name: 'Douala Deido', city: 'Douala', region: 'Littoral', address: 'Carrefour Deido' },
    { code: 'DLA-NDF', name: 'Douala Ndokoti', city: 'Douala', region: 'Littoral', address: 'Carrefour Ndokoti' },
    { code: 'DLA-NEW', name: 'Douala New-Bell', city: 'Douala', region: 'Littoral', address: 'Marché New-Bell' },
    { code: 'EDA-001', name: 'Edéa', city: 'Edéa', region: 'Littoral', address: 'Axe lourd, Immeuble Tiwa, à côté Pharmacie Edéa' },
    { code: 'NKS-001', name: 'Nkongsamba', city: 'Nkongsamba', region: 'Littoral', address: 'Centre-ville Nkongsamba' },

    // ============================================
    // REGION OUEST
    // ============================================
    { code: 'BFS-001', name: 'Bafoussam', city: 'Bafoussam', region: 'Ouest', address: 'Face Maison du Parti, à côté ITEL' },
    { code: 'BFS-002', name: 'Bafoussam Marché A', city: 'Bafoussam', region: 'Ouest', address: 'Grand Marché A, Bafoussam' },
    { code: 'DSG-001', name: 'Dschang', city: 'Dschang', region: 'Ouest', address: 'Entre la gare routière et Congelcam' },
    { code: 'DSG-FTO', name: 'Dschang Foto', city: 'Dschang', region: 'Ouest', address: 'Face Tam Tam Week-End' },
    { code: 'FBN-001', name: 'Foumban', city: 'Foumban', region: 'Ouest', address: 'Derrière la Mosquée Centrale' },
    { code: 'FBT-001', name: 'Foumbot', city: 'Foumbot', region: 'Ouest', address: 'Entre dépôt Guinness et Tropicasem' },
    { code: 'BNG-001', name: 'Bangangté', city: 'Bangangté', region: 'Ouest', address: 'Centre-ville Bangangté' },
    { code: 'MDH-001', name: 'Mbouda', city: 'Mbouda', region: 'Ouest', address: 'Centre-ville Mbouda' },

    // ============================================
    // REGION NORD-OUEST
    // ============================================
    { code: 'BDA-001', name: 'Bamenda', city: 'Bamenda', region: 'Nord-Ouest', address: 'Commercial Avenue, Bamenda' },
    { code: 'BDA-002', name: 'Bamenda Nkwen', city: 'Bamenda', region: 'Nord-Ouest', address: 'Nkwen, Bamenda' },

    // ============================================
    // REGION SUD-OUEST
    // ============================================
    { code: 'LMB-001', name: 'Limbe', city: 'Limbe', region: 'Sud-Ouest', address: 'Beside Standard Pha, Limbe' },
    { code: 'BEA-001', name: 'Buéa', city: 'Buéa', region: 'Sud-Ouest', address: 'Centre-ville Buéa' },
    { code: 'MTG-001', name: 'Mutengene', city: 'Mutengene', region: 'Sud-Ouest', address: 'Immeuble Télé Podium' },
    { code: 'TKO-001', name: 'Tiko', city: 'Tiko', region: 'Sud-Ouest', address: 'Treasury building, près du Marché Tiko' },
    { code: 'KMB-001', name: 'Kumba', city: 'Kumba', region: 'Sud-Ouest', address: 'Centre-ville Kumba' },

    // ============================================
    // REGION SUD
    // ============================================
    { code: 'EBW-001', name: 'Ebolowa', city: 'Ebolowa', region: 'Sud', address: 'Carrefour Samba' },
    { code: 'EBW-005', name: 'Ebolowa Lac', city: 'Ebolowa', region: 'Sud', address: 'Au Marché du Lac d\'Ebolowa' },
    { code: 'EBW-ENG', name: 'Ebolowa Engallé', city: 'Ebolowa', region: 'Sud', address: 'Face Nexttel' },
    { code: 'KBI-001', name: 'Kribi', city: 'Kribi', region: 'Sud', address: 'Centre-ville Kribi' },
    { code: 'SGM-001', name: 'Sangmélima', city: 'Sangmélima', region: 'Sud', address: 'Avant Hôpital Référence Akon' },
    { code: 'SGM-002', name: 'Sangmélima 3', city: 'Sangmélima', region: 'Sud', address: 'Face Buca Voyage' },
    { code: 'AMB-001', name: 'Ambam', city: 'Ambam', region: 'Sud', address: 'Centre-ville Ambam' },
    { code: 'DJM-001', name: 'Djoum', city: 'Djoum', region: 'Sud', address: 'Centre-ville Djoum' },
    { code: 'LLF-001', name: 'Lolodorf', city: 'Lolodorf', region: 'Sud', address: 'Centre-ville Lolodorf' },
    { code: 'MAN-001', name: 'Ma\'an', city: 'Ma\'an', region: 'Sud', address: 'Centre-ville Ma\'an' },
    { code: 'ZTL-001', name: 'Zoétélé', city: 'Zoétélé', region: 'Sud', address: 'Centre-ville Zoétélé' },
    { code: 'MYM-001', name: 'Meyomessala', city: 'Meyomessala', region: 'Sud', address: 'Centre-ville Meyomessala' },
    { code: 'MTM-001', name: 'Mintom', city: 'Mintom', region: 'Sud', address: 'Centre-ville Mintom' },
    { code: 'NYT-001', name: 'Nyété', city: 'Nyété', region: 'Sud', address: 'Centre-ville Nyété' },
    { code: 'KOS-001', name: 'Kyé-Ossi', city: 'Kyé-Ossi', region: 'Sud', address: 'Carrefour Des Nations, 100m de la frontière' },
    { code: 'KOS-002', name: 'Kyé-Ossi 2', city: 'Kyé-Ossi', region: 'Sud', address: 'Carrefour 3 Nations' },

    // ============================================
    // REGION EST
    // ============================================
    { code: 'BRT-001', name: 'Bertoua', city: 'Bertoua', region: 'Est', address: 'À côté de la Maison du Parti' },
    { code: 'ABM-001', name: 'Abong-Mbang', city: 'Abong-Mbang', region: 'Est', address: 'Face station Total' },
    { code: 'YKD-001', name: 'Yokadouma', city: 'Yokadouma', region: 'Est', address: 'Au centre commercial' },
    { code: 'GBL-001', name: 'Garoua-Boulaï', city: 'Garoua-Boulaï', region: 'Est', address: 'Entrée de ville, Immeuble ATEFI' },
    { code: 'MLD-001', name: 'Mouloundou', city: 'Mouloundou', region: 'Est', address: 'Face rond-point entrée marché' },

    // ============================================
    // REGION ADAMAOUA
    // ============================================
    { code: 'NGD-001', name: 'Ngaoundéré', city: 'Ngaoundéré', region: 'Adamaoua', address: 'Marché principal, près Boulangerie Helou' },
    { code: 'NGD-ADM', name: 'Ngaoundéré Adama', city: 'Ngaoundéré', region: 'Adamaoua', address: 'Centre commercial, entre Orange et Librairie du Savoir' },
    { code: 'TBT-001', name: 'Tibati', city: 'Tibati', region: 'Adamaoua', address: 'Au Grand Marché du dimanche' },
    { code: 'BNY-001', name: 'Banyo', city: 'Banyo', region: 'Adamaoua', address: 'À côté d\'Orange' },
    { code: 'MGN-001', name: 'Meiganga', city: 'Meiganga', region: 'Adamaoua', address: 'Face Pharmacie du Mbéré' },

    // ============================================
    // REGION NORD
    // ============================================
    { code: 'GRA-001', name: 'Garoua', city: 'Garoua', region: 'Nord', address: 'Centre-ville Garoua' },
    { code: 'GRA-002', name: 'Garoua II', city: 'Garoua', region: 'Nord', address: 'Avenue des banques, face Chambre de Commerce' },
    { code: 'TBR-001', name: 'Touboro', city: 'Touboro', region: 'Nord', address: 'Face Grande Mosquée de Touboro' },
    { code: 'TBR-002', name: 'Touboro Ngoumi', city: 'Touboro', region: 'Nord', address: 'Carrefour Ngoumi' },

    // ============================================
    // REGION EXTREME-NORD
    // ============================================
    { code: 'MRA-001', name: 'Maroua', city: 'Maroua', region: 'Extrême-Nord', address: 'Face Grand Marché Maroua' },
    { code: 'MRA-SIC', name: 'Maroua Camp SIC', city: 'Maroua', region: 'Extrême-Nord', address: 'Carrefour DJARMA' },
    { code: 'MRA-DJR', name: 'Maroua Djarengol', city: 'Maroua', region: 'Extrême-Nord', address: 'À côté Hysacam' },
    { code: 'KSR-001', name: 'Kousseri', city: 'Kousseri', region: 'Extrême-Nord', address: 'Face Établissement Attiko Sidi' },
    { code: 'KSR-003', name: 'Kousseri 3', city: 'Kousseri', region: 'Extrême-Nord', address: 'Carrefour Douane' },
    { code: 'YGO-001', name: 'Yagoua', city: 'Yagoua', region: 'Extrême-Nord', address: 'Centre-ville Yagoua' },
    { code: 'MGA-001', name: 'Maga', city: 'Maga', region: 'Extrême-Nord', address: 'Au Marché, à côté de la gare' },
    { code: 'MTW-001', name: 'Moutourwa', city: 'Moutourwa', region: 'Extrême-Nord', address: 'Avenue Commerciale' },
    { code: 'MGD-001', name: 'Mogode', city: 'Mogodé', region: 'Extrême-Nord', address: '100m de la Sous-préfecture' },
    { code: 'KZA-001', name: 'Koza', city: 'Koza', region: 'Extrême-Nord', address: 'Centre-ville Koza' },
    { code: 'BGO-001', name: 'Bogo', city: 'Bogo', region: 'Extrême-Nord', address: 'Centre-ville Bogo' },
    { code: 'BNK-001', name: 'Banki-Amchide', city: 'Banki', region: 'Extrême-Nord', address: 'Zone frontalière Banki' }
];

const seedAgencies = async () => {
    try {
        // Connexion
        await sequelize.authenticate();
        console.log('✅ Connexion BDD réussie\n');

        // Synchroniser le modèle Agency (ne pas forcer => ne supprime pas les données)
        await Agency.sync();

        let created = 0;
        let skipped = 0;

        for (const ag of EXPRESS_UNION_AGENCIES) {
            // Vérifier si l'agence existe déjà par code
            const existing = await Agency.findOne({ where: { code: ag.code } });
            if (existing) {
                skipped++;
                continue;
            }

            await Agency.create({
                code: ag.code,
                name: ag.name,
                city: ag.city,
                region: ag.region,
                address: ag.address,
                is_active: true
            });
            created++;
        }

        console.log(`\n📊 Résultat du seed :`);
        console.log(`   ✅ Agences créées : ${created}`);
        console.log(`   ⏭️  Agences déjà existantes : ${skipped}`);
        console.log(`   📋 Total agences en base : ${await Agency.count()}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed des agences:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedAgencies();
