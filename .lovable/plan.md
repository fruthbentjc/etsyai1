

# Gestionnaire de Boutique Etsy 🛍️ + Multi-IA

Application en français pour gérer votre boutique Etsy, avec chaque IA assignée à une tâche spécifique.

---

## Phase 1 — Fondations ✅

### 1. Tableau de bord principal ✅
- Vue d'ensemble : nombre de produits, commandes récentes, chiffre d'affaires
- Navigation entre les sections (Produits, Commandes, Tendances, IA, Paramètres)
- Routes protégées avec authentification

### 2. Gestionnaire de produits (CRUD) ✅
- Liste des produits avec recherche et filtres
- Création / modification / suppression de fiches produits
- Upload et gestion des photos (réorganisation, suppression) via `ProductImageManager`
- Gestion des prix, stocks, tags, catégories et variantes
- Statut de publication (brouillon / actif / inactif)
- Synchronisation depuis Etsy (via edge function `etsy-sync-products`)

### 3. Suivi des commandes ✅
- Liste des commandes avec statut (en_attente, expediee, livree, annulee)
- Détails de chaque commande (produits, client, adresse)
- Synchronisation depuis Etsy (via edge function `etsy-sync-orders`)
- Mode cron pour synchronisation automatique de toutes les boutiques

### 4. Connexion API Etsy ✅
- Authentification OAuth 2.0 via edge functions (`etsy-auth`, `etsy-callback`)
- Synchronisation des produits et commandes (boutons manuels dans Paramètres)
- Indicateur de dernière synchronisation (produits & commandes)
- Déconnexion de la boutique Etsy
- Rafraîchissement automatique des tokens expirés

### 5. Authentification ✅
- Page de connexion / inscription (`/auth`)
- Réinitialisation de mot de passe (`/reset-password`)
- Routes protégées et routes publiques
- Contexte d'authentification global (`AuthContext`)

### 6. Page Paramètres ✅
- Connexion/déconnexion Etsy avec statut visuel
- Boutons de synchronisation manuelle (produits & commandes)
- Date de dernière synchronisation affichée
- Section clés API (OpenAI, Anthropic, Perplexity) — UI prête, BYOK à implémenter
- Préférences générales (nom boutique, devise)

---

## Phase 2 — Intelligence Artificielle Multi-Modèles (en cours)

### 7. Lovable AI (Gemini) → Génération de contenu ⚙️
- Rédaction automatique de descriptions produits (edge function `generate-description`)
- Suggestions de titres optimisés SEO (edge function `generate-seo-title`)
- Page outils IA (`/ia`)
- 🔲 Traduction de fiches produits en plusieurs langues

### 8. Perplexity → Recherche & Veille marché ⚙️
- Recherche de tendances Etsy (edge function `perplexity-trends`, page `/tendances`)
- 🔲 Analyse concurrentielle
- 🔲 Recherche SEO avancée (mots-clés et tags)

### 9. OpenAI (GPT) → Analyse avancée & Stratégie 🔲
- 🔲 Analyse de performance des produits
- 🔲 Recommandations de pricing
- 🔲 Prédictions de ventes

### 10. Claude → Assistant conversationnel boutique 🔲
- 🔲 Chat intelligent pour questions gestion Etsy
- 🔲 Aide à la rédaction de messages clients
- 🔲 Conseils personnalisés basés sur les données boutique

### 11. Page de configuration IA 🔲
- 🔲 Option BYOK fonctionnelle (stockage sécurisé des clés)
- 🔲 Choix du modèle par catégorie de tâche
- 🔲 Indicateur de consommation/crédits

---

## Stack technique
- **Frontend** : React + Tailwind CSS + shadcn/ui
- **Backend** : Lovable Cloud — base de données, auth, edge functions, secrets
- **IA** : Lovable AI (Gemini), Perplexity (edge function), OpenAI & Claude (à venir)
- **API Etsy** : OAuth 2.0 via edge functions sécurisées
- **Edge functions déployées** : `etsy-auth`, `etsy-callback`, `etsy-sync-products`, `etsy-sync-orders`, `generate-description`, `generate-seo-title`, `perplexity-trends`

---

### Légende
- ✅ Terminé
- ⚙️ Partiellement implémenté
- 🔲 À faire
