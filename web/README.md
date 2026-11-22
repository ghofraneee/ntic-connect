# NTIC Connect

Prototype public et privé de l’établissement OFPPT NTIC Safi.

## Technologie

- React 19, TypeScript et Vite
- React Router
- Tailwind CSS 4
- Framer Motion
- Three.js, React Three Fiber et Drei
- Lenis pour le défilement du site public
- Stockage local simulé avec `localStorage`

Le site public conserve sa scène 3D. Elle n’est pas montée sur les routes `/app/*`.

## Comptes de démonstration

Mot de passe commun : `demo1234`

| Rôle | Adresse |
| --- | --- |
| Stagiaire | `stagiaire@demo.ma` |
| Formateur | `formateur@demo.ma` |
| Direction | `direction@demo.ma` |
| Responsable de club | `club@demo.ma` |

Tous les comptes sont fictifs. Les données sont enregistrées dans le navigateur sous `ntic-connect:data:v1` et la session sous `ntic-connect:session`.

## Espaces privés

- `/app/stagiaire` : tableau de bord, annonces, bibliothèque, demandes, emploi du temps, clubs, opportunités et profil.
- `/app/formateur` : tableau de bord, cours, dépôt de cours, annonces sectionnelles et profil.
- `/app/direction` : tableau de bord, demandes, détail et changement de statut, annonces ciblées.
- `/app/club` : tableau de bord, événements, participants et adhésions.

Le menu « Mode démo » permet de changer rapidement de rôle sans ressaisir les identifiants. « Réinitialiser la démo » restaure les données initiales sans supprimer la session courante.

## Scénario de démonstration complet

1. Connectez-vous comme Stagiaire.
2. Ouvrez **Demandes administratives**, puis **Nouvelle demande**.
3. Envoyez une demande « Attestation de scolarité ».
4. Passez en session Direction avec « Mode démo ».
5. Ouvrez la demande envoyée et changez son statut en « En traitement ».
6. Revenez en session Stagiaire : le statut et la notification sont visibles.
7. Passez en Direction et publiez une annonce pour « tous ».
8. Revenez en Stagiaire pour consulter l’annonce.
9. Passez en Formateur et déposez un cours.
10. Revenez en Stagiaire : le cours apparaît dans la bibliothèque de sa filière.

## Lancement

Depuis le dossier `web` :

```powershell
npm install
npm run dev
```

Puis ouvrez `http://127.0.0.1:5173`.

## Vérification

```powershell
npm run build
npm run lint
npm run dev
```
