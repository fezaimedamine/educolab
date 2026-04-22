# EduColab

Bienvenue sur le projet EduColab. Ce document explique comment lancer le projet complet pour le développement, avec le backend en Spring Boot, le frontend en React/Vite, et la base de données PostgreSQL gérée automatiquement par Docker.

## 📌 Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants sur votre machine :

1. **Java 17** (ou plus)
2. **Node.js** (et npm)
3. **Docker Desktop** (Doit **impérativement être allumé** et en cours d'exécution en arrière-plan)

---

## 🚀 1. Lancer le Backend (Spring Boot & PostgreSQL)

Le backend est configuré pour lancer **automatiquement** le fichier `db/compose.yaml` (qui contient la base de données PostgreSQL) au démarrage, grâce à l'intégration `spring-boot-docker-compose`. Vous n'avez pas besoin d'exécuter de commandes Docker manuellement !

1. **Assurez-vous que Docker Desktop est ouvert.**
2. Ouvrez un terminal et naviguez dans le dossier `backend_spring` :
   ```bash
   cd backend_spring
   ```
3. Lancez le projet avec Maven :
   ```bash
   # Sur Windows :
   .\mvnw spring-boot:run
   
   # Sur Mac/Linux :
   ./mvnw spring-boot:run
   ```

*💡 Note : Lors du tout premier lancement, la base de données `educolab` sera créée et le fichier `db/schema.sql` sera exécuté automatiquement pour créer les tables nécessaires.* Le backend sera disponible sur le port `8080`.

---

## 🚀 2. Lancer le Frontend (React/Vite)

Le frontend doit être démarré dans un terminal séparé.

1. Ouvrez un **nouveau terminal** et naviguez vers le dossier `frontend` :
   ```bash
   cd frontend
   ```
2. Installez les dépendances du projet (nécessaire seulement la première fois et lors de l'ajout de nouveaux packages) :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

Le site frontend sera alors accessible depuis votre navigateur via l'URL indiquée dans ce terminal (généralement `http://localhost:5173`).
