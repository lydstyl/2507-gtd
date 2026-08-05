# Migration dépendances — 05/08/2026

Feature : mise à jour complète des dépendances npm + bumps majeurs ciblés.
Branche : `feature/mise-jour-compl-te-des-d-pendances-npm-npm-update-`

## Bump majeur effectué

### TypeScript 5.8.3 → 6.0.3 ✅
- Bump appliqué sur les 4 packages : `backend`, `frontend`, `shared`, `mcp-server` (`^6.0.3` partout).
- Adaptations :
  - `shared/tsconfig.json` : ajout de `"ignoreDeprecations": "6.0"`.
  - `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `mcp-server/tsconfig.json` : ajout de `"ignoreDeprecations": "6.0"` (défensif contre les dépréciations futures de la série 6.x).
  - `backend/tsconfig.json` : nettoyage (options dépréciées retirées).
  - `backend/src/infrastructure/adapters/CsvFileAdapter.ts` : ajustement typage (compilation TS6).
  - `shared/src/index.ts` : export des types via l'entrypoint (au lieu de `dist/esm`).
- Vérifié : compilation TS6 sans erreur sur les 4 packages, 610 tests verts.
- ⚠️ **TS 7 bloqué** : l'outillage actuel (`typescript-eslint` 8.66, `ts-node` 10.9.2) ne supporte pas TS 7. À ré-évaluer quand ces outils sortiront une version compatible.

## `npm update` (mineurs, dans les contraintes semver)

| Package | Avant | Après (lock) |
|---|---|---|
| Prisma / @prisma/client | 6.17.1 | 6.19.3 |
| Vitest | 3.2.4 | 3.2.7 |
| Tailwind CSS | 3.4.17 | 3.4.19 |
| TipTap (@tiptap/react) | 2.24.2 | 2.27.2 |
| AI SDK (`ai`) | 5.0.74 | 5.0.226 |
| Vite | 4.5.14 | 4.5.14 (inchangé, voir ci-dessous) |

## Bumps majeurs NON effectués (documentés, version actuelle conservée)

### Prisma 7 — non fait
Migration trop grosse (changements de config, génération de client, schéma). Conservé en 6.19.3. À planifier séparément avec un audit des breaking changes.

### Tailwind CSS 4 — non fait
Migration trop grosse (nouveau moteur, config CSS-first, changements de plugins). Conservé en 3.4.19. La config actuelle (tailwind.config.js + directives) reste valide en 3.x.

### Vite 5+ — non fait
Vite reste en 4.5.14. Note : une version interne de Vite 7.x existe dans l'arbre de dépendances (via `vitest`/`vite-node`) mais le projet utilise toujours Vite 4.5.14 en direct. Un bump Vite majeur est à planifier avec le bump Tailwind 4 (les deux touchent la chaîne de build frontend).

### AI SDK / TipTap — bumps majeurs non concernés
`ai` est resté dans la série 5.x (5.0.74 → 5.0.226, 152 versions mineures — comportement stable, tests verts). TipTap est resté en 2.x (2.24.2 → 2.27.2). Pas de série majeure plus récente applicable sans migration.

## Règles de validation

- Contrat = les tests existants : `npm run test` (shared + backend + frontend) doit rester vert après chaque bump.
- Tests sur `gtd_test` uniquement (jamais `gtd_production`).
- Build complet : `npm run build` (shared → backend → frontend).
- `mcp-server/` n'est pas dans les npm workspaces : install/build séparés (`cd mcp-server && npm install && npm run build`).
