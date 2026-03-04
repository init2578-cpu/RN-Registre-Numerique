# Guide d'Utilisation - Registre Numérique

Ce manuel de prise en main rapide a pour but de vous familiariser avec les différentes interfaces et fonctionnalités du Registre Numérique des Visiteurs du service.

---

## 1. Démarrage de l'Application
L'application est conçue pour fonctionner comme un logiciel de bureau autonome.

*   **Lancement au quotidien :** Exécutez le raccourci **Registre Numérique** sur votre bureau (ou lancez `npm run dev` si vous êtes en mode développement).
*   L'interface principale s'ouvrira, contenant un panneau latéral gauche pour l'enregistrement et une zone centrale pour le suivi.

---

## 2. Le Menu Latéral (Enregistrement d'une Entrée)
Positionné à gauche de l'écran (sous le logo du service), ce formulaire permet d'accueillir un visiteur.

### Étapes pour enregistrer un visiteur :
1.  **Renseignez le Numéro de Téléphone :** C'est le champ principal. S'il s'agit d'un visiteur fréquent, le système reconnaîtra son numéro et pré-remplira automatiquement son Nom, Prénom et Type/Numéro de pièce d'identité.
2.  **Identité et Provenance :** Complétez ou vérifiez le Prénom, Nom et la provenance (Quartier/Institution).
3.  **Pièce d'Identité :** Sélectionnez le type (CNI, Passeport, Autre) et renseignez le numéro.
4.  **Motif et Service :** Choisissez la raison de la visite (Si vous cochez "Autre", un champ supplémentaire s'affichera pour préciser le motif). Indiquez la personne ou le service demandé.
5.  Cliquez sur le grand bouton vert **Valider l'Entrée**.

> **À noter :** Dès la validation, le visiteur apparaît instantanément dans le tableau central "Présence Réelle".

---

## 3. Le Tableau de Bord (Dashboard Principal)
L'onglet **Dashboard** offre une vue d'ensemble en temps réel sur l'activité du bureau.

### Les Statistiques Temps Réel (En haut)
*   **En Cours (Orange) :** Le nombre de visiteurs *actuellement* à l'intérieur de l'établissement.
*   **Aujourd'hui (Vert) :** Le total cumulé des visites validées pour la journée en cours.
*   **Ce Mois (Bleu) :** Le cumul des visites mensuelles.

### Le Tableau des "Présences Réelles" (Au centre)
Il liste tous les visiteurs qui ne sont pas encore partis. Il affiche l'heure d'arrivée, le contact exact et le motif.

*   **Sortie (Rouge) :** Lorsqu'un visiteur quitte les locaux, cliquez sur ce bouton pour valider son départ.
*   **Annuler (Gris) :** En cas d'erreur de saisie (ex: doublon), cliquez sur ce bouton. Le visiteur passera en statut "Annulé".
*   **Rejeter (Noir) :** Si l'accès est finalement refusé, cliquez sur ce bouton (le statut deviendra "Rejeté").
*   Un **Popup de confirmation** s'ouvrira pour vous demander de confirmer chacune de ces actions avant de déplacer le visiteur vers les archives.

---

## 4. L'Onglet Statistiques & Affluence
Cet espace est dédié à l'analyse à long terme de vos flux de visiteurs.

*   **Chiffres Globaux :** Rappel des totaux mensuels, annuels et depuis la création du registre.
*   **Les Tops (Heures, Jours, Mois) :** Trois encarts analysent vos données pour déterminer à quelles heures vous avez le plus d'affluence, quel jour de la semaine est le plus chargé, etc.
*   **Graphiques interactifs :** Cliquez sur l'icône de loupe à côté des diagrammes circulaires (Motifs et Statuts) ou des courbes d'évolution pour les agrandir en plein écran.

**Exportation des Statistiques :** En haut à droite, le bouton **Télécharger le Rapport Excel** vous permet de générer un fichier `.csv` structuré regroupant toutes ces tendances (Parfait pour un compte-rendu de direction).

---

## 5. L'Onglet Archives & Historique
C'est ici que reposent les données de tous les mouvements terminés.

*   **Filtres de Recherche :** Vous pouvez chercher une visite spécifique en sélectionnant une Date, ou en tapant un nom, un prénom ou un numéro de téléphone dans la barre de recherche.
*   **Détail du Tableau :** Le tableau consigne avec précision l'heure d'entrée et l'heure de sortie. Par souci de visibilité technique, l'information de la pièce d'identité (CNI/Passeport) est logée subtilement sous le numéro de téléphone.
*   **Exportation de l'Historique :** Le bouton d'export permet de télécharger sur votre ordinateur la liste affichée sous un format tableur Excel pour vos propres traitements locaux.
*   **Correction & Nettoyage :** Vous pouvez **Modifier** ou **Supprimer** définitivement une entrée. (Mot de passe requis : `iNiT@CRE_KOLDA`)

---

## 6. Personnalisation Globale & Administration
Cliquez sur le bouton bleu flottant contenant l'icône **⚙️ Paramètres** situé **en bas à droite** de l'écran pour ouvrir l'interface d'administration.

*   **Informations de l'Application :** Vous pouvez uploader un nouveau Logo (image) et modifier le Titre de l'application affiché en haut du menu latéral.
*   **Apparence & Couleurs :** Un nuancier vous permet de personnaliser les couleurs dominantes (Barre latérale, boutons d'action "Valider", boutons d'action secondaires). Un bouton "Réinitialiser" permet de remettre les couleurs par défaut.
*   **Gestion de la Base de Données 💾 :**
    *   **Sauvegarder :** Télécharge instantanément une copie de toutes vos données (fichier `.sqlite`). Idéal pour un backup quotidien.
    *   **Restaurer :** Uploadez un fichier sauvegardé pour écraser les données actuelles.
    *   **Vider la base :** (Action sensible) Efface en un clic tout l'historique et les statistiques. Pratique pour commencer une nouvelle année civile.

> **Sécurité :** Toutes ces modifications de paramètres nécessitent obligatoirement de saisir le Mot de Passe Administrateur : **`CodeFire@CRE_KOLDA`**.

---

*Ce système a été créé pour assurer un suivi fluide, sécurisé (base de données locale) et optimisé pour fluidifier le travail de l'accueil au sein des services.*

Version 1.0.3 © 2026 | iNiT - CRE KOLDA
