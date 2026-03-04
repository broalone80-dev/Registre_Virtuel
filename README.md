# 🌐 Registre Virtuel EU

**Registre Virtuel EU** est une application full-stack moderne conçue pour la gestion du matériel informatique et le suivi de la maintenance. L'application offre une interface utilisateur élégante avec des animations fluides et un backend robuste sécurisé.

> [!NOTE]
> Ce projet est actuellement **en cours de développement**. Certaines fonctionnalités peuvent être incomplètes ou en phase de test.

---

## 🚀 Fonctionnalités Principales

### 🔐 Authentification & Sécurité
- Connexion et inscription sécurisées (JWT + Bcryptjs).
- Gestion complète du cycle de vie du mot de passe (oublié/réinitialisation).
- Protection contre les attaques courantes (Helmet, Rate Limiting).
- Gestion des permissions et rôles (en cours).

### 🖥️ Gestion du Matériel & Utilisateurs
- Tableau de bord intuitif pour le suivi des équipements.
- Liste des utilisateurs avec options de notification par email.
- Gestion des agences et des départements.

### 📧 Notifications
- Envoi automatique d'emails via SMTP (Nodemailer).
- Templates d'emails pour le reset de mot de passe et les notifications système.

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : [React 19](https://reactjs.org/)
- **Build Tool** : [Vite](https://vitejs.dev/)
- **Animations** : [Framer Motion](https://www.framer.com/motion/)
- **Icons** : [React Icons](https://react-icons.github.io/react-icons/)
- **State Management** : [Zustand](https://github.com/pmndrs/zustand)
- **Notifications UI** : [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **Runtime** : [Node.js](https://nodejs.org/)
- **Framework** : [Express](https://expressjs.com/)
- **ORM** : [Sequelize](https://sequelize.org/) (MySQL)
- **Documentation API** : [Swagger / OpenAPI](https://swagger.io/)
- **Validation** : [Joi](https://joi.dev/)

---

## ⚙️ Configuration & Installation

### Prérequis
- Node.js (v18+)
- MySQL (ou XAMPP pour la base de données)

### Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/broalone80-dev/Registre_Virtuel.git
   cd API_FIN
   ```

2. **Backend (API)**
   ```bash
   cd api
   npm install
   cp .env.example .env # Configurez vos variables d'environnement
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### Variables d'Environnement (.env)
Configurez les clés suivantes dans votre fichier `.env` à la racine :
```env
DB_HOST=127.0.0.1
DB_NAME=registre_virtuel
DB_USER=root
DB_PASS=
JWT_SECRET=votre_secret_ici
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
```

---

## 📂 Structure du Projet

- `/api` : Code source du backend Express.
- `/frontend` : Application React moderne.
- `/database` : Scripts de migration et schémas SQL.
- `/docker` : Fichiers de configuration pour le déploiement conteneurisé.
- `/docs` : Documentation technique et API.

---

## 📄 Licence
Ce projet est sous licence MIT.

---
*Développé avec ❤️ par Arnaud.*
