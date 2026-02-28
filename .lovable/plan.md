

# Gestionnaire de Boutique Etsy 🛍️ + Multi-IA

Application en français pour gérer votre boutique Etsy, avec chaque IA assignée à une tâche spécifique.

---

## Phase 1 — Fondations

### 1. Tableau de bord principal
- Vue d'ensemble : nombre de produits, commandes récentes, chiffre d'affaires
- Navigation entre les sections (Produits, Commandes, Analyses, IA)

### 2. Gestionnaire de produits (CRUD)
- Liste des produits avec recherche et filtres
- Création / modification / suppression de fiches produits
- Upload et gestion des photos (réorganisation, suppression)
- Gestion des prix, stocks et variantes (taille, couleur, matière…)
- Statut de publication (brouillon / actif / inactif)

### 3. Suivi des commandes
- Liste des commandes avec statut (en attente, expédiée, livrée)
- Détails de chaque commande (produits, client, adresse)
- Filtres par statut et par date

### 4. Connexion API Etsy
- Authentification OAuth 2.0 avec votre compte Etsy
- Synchronisation des produits et commandes
- Edge functions sécurisées pour les appels API

---

## Phase 2 — Intelligence Artificielle Multi-Modèles

### 5. Lovable AI (Gemini) → Génération de contenu
- Rédaction automatique de descriptions produits
- Suggestions de titres optimisés pour Etsy
- Traduction de fiches produits en plusieurs langues

### 6. Perplexity → Recherche & Veille marché
- **Recherche de tendances Etsy** : produits populaires, niches en croissance
- **Analyse concurrentielle** : comparaison avec les boutiques similaires
- **Recherche SEO** : meilleurs mots-clés et tags à utiliser

### 7. OpenAI (GPT) → Analyse avancée & Stratégie
- Analyse de performance des produits (lesquels promouvoir, lesquels retirer)
- Recommandations de pricing basées sur le marché
- Prédictions de ventes et conseils stratégiques

### 8. Claude → Assistant conversationnel boutique
- Chat intelligent pour répondre à vos questions sur la gestion Etsy
- Aide à la rédaction de messages clients
- Conseils personnalisés basés sur vos données boutique

### 9. Page de configuration IA
- Clés API par défaut (vos clés) pré-configurées
- Option BYOK : chaque utilisateur peut entrer ses propres clés API (OpenAI, Anthropic, Perplexity)
- Choix du modèle préféré par catégorie de tâche
- Indicateur de consommation/crédits restants

---

## Stack technique
- **Frontend** : React + Tailwind CSS + shadcn/ui
- **Backend** : Lovable Cloud (Supabase) — base de données, auth, edge functions, secrets
- **IA** : Lovable AI (Gemini), Perplexity (connecteur), OpenAI & Claude (clés API via secrets)
- **API Etsy** : OAuth 2.0 via edge functions sécurisées

