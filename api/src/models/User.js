/**
 * MODÈLE USER
 * Gère les utilisateurs du système (admin, manager, technicien, réceptionniste)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(180),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Email invalide' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'technician', 'receptionist'),
        defaultValue: 'receptionist',
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_token_expires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        // Hash le mot de passe avant création
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        // Hash le mot de passe avant mise à jour
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Méthode pour vérifier le mot de passe
User.prototype.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Méthode pour retourner l'utilisateur sans le mot de passe
User.prototype.toSafeObject = function () {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
};

module.exports = User;
