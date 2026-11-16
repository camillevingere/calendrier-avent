# 🎄 Skill Quest — le calendrier de l'Avent IA de Fyliz

24 skills IA (Claude Code, Codex, Cursor…) choisis pour les PME et les entrepreneurs : un niveau se débloque chaque jour de décembre à minuit, heure de Paris. Pour jouer, on entre son email : il part dans Lumail avec le tag `calendrier-avent`.

Next.js 16, aucune base de données, hébergé sur Vercel.

## Comment ça marche

```
contenu/source/*.md     (en clair, JAMAIS commité, reste sur ta machine)
        │  pnpm chiffrer  (CONTENU_CLE)
        ▼
contenu/chiffre/*.json  (AES-256-GCM, une clé dérivée par case, commité)
        │
        │  GitHub Action « Robot du calendrier », toutes les 5 min
        │  → calcule les cases dues (heure de Paris)
        │  → écrit leur clé dans etat/ouvertes.json et commite
        ▼
Vercel redéploie au push
        │  prebuild : déchiffre UNIQUEMENT les cases publiées
        │  verifier : refuse le déploiement si une case est en avance
        ▼
Le site : grille de 24 cases, contenu servi seulement aux inscrits (cookie signé)
```

- **Pas de base de données.** L'état partagé par tous les visiteurs est le fichier `etat/ouvertes.json`, écrit par le robot dans le dépôt.
- **Le contenu futur est introuvable.** Il n'est ni dans la page, ni dans les fichiers du site, ni lisible dans le dépôt, son historique ou les journaux du robot. Changer l'horloge de son ordinateur ou deviner une URL ne donne rien : la case n'existe pas côté site tant que sa clé n'est pas publiée.
- **Inscrit une fois.** Après l'email, un cookie httpOnly signé (400 jours) garde l'accès sur cet appareil.

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Site local sur http://localhost:3000 |
| `pnpm apercu 2026-12-12` | Montre le site tel qu'il sera le 12 décembre, en local seulement (`pnpm apercu stop` pour revenir) |
| `pnpm chiffrer` | Rechiffre `contenu/source/` vers `contenu/chiffre/`, et signale les cases manquantes |
| `pnpm robot --maintenant 2026-12-03T08:00:00+01:00` | Essaie le robot à une date donnée, en local (interdit sur GitHub) |
| `pnpm verifier` | Le contrôle d'avant déploiement |
| `pnpm test` | Tests de la règle du calendrier et du coffre |
| `pnpm cle` | Génère une nouvelle clé maîtresse |

## Le réglage unique : `calendrier.config.json`

```json
{ "mode": "normal", "accelere": { "depart": "2026-11-16T20:30:00+01:00", "intervalleMinutes": 5 } }
```

- `"normal"` : la case N s'ouvre le N décembre à 00:00, heure de Paris.
- `"accelere"` (mode soirée) : la case N s'ouvre à `depart + (N-1) × 5 min`. Commite, pousse, et le robot suit.

Le robot peut aussi être lancé à la main : onglet **Actions → Robot du calendrier → Run workflow**. Chaque passage note dans son journal l'heure (UTC et Paris), le mode, les cases ouvertes et ce qu'il a fait. En cas d'échec (clé absente, case illisible), le job devient rouge et GitHub envoie un email.

## Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `LUMAIL_API_KEY` | Vercel | Inscrit les emails dans Lumail |
| `GATE_SECRET` | Vercel | Signe le cookie « déjà inscrit » (`openssl rand -base64 32`) |
| `LUMAIL_TAG` | Vercel, optionnel | Tag Lumail, `calendrier-avent` par défaut |
| `CONTENU_CLE` | `.env.local` + secret GitHub, **jamais Vercel** | Clé maîtresse du contenu |

## Décisions prises (les points « à trancher »)

- **Après le 24.** À partir du 25 décembre, les 24 cases restent ouvertes en souvenir (« Game complete »).
- **Retour au mode normal après la soirée.** L'état est recalculé à chaque passage, donc les cases ouvertes en avance se referment sur le site. Limite honnête : leurs clés restent dans l'historique git public. Pour un vrai secret, il faudrait changer `CONTENU_CLE` et tout rechiffrer.
- **Stratégie de protection.** Chiffrement par case plus publication des clés par le robot. Coût : un commit et un redéploiement Vercel par ouverture (24 en décembre, environ 24 en une soirée accélérée). Tout tient dans les offres gratuites de GitHub (dépôt public) et de Vercel Hobby.

## Limites connues

- Le cron de GitHub peut avoir quelques minutes de retard : une case s'ouvre au plus tôt à son heure, jamais avant.
- Pas de limitation du nombre d'appels sur `/api/inscription` : seul un piège à robots (champ caché) est en place.
- Les sources en clair (`contenu/source/`) n'existent que sur ta machine : sauvegarde-les.
