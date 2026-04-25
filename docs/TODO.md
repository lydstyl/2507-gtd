La nouvelle façon de trié sera les groupes de taches suivant dans l'ordre :
brouillon
pour IA
collecte (en se basant sur le status cette fois)
en retard
aujourd'hui
demain
sans date mais trié par importance
avec date dans le futur

---

Lis les fichiers importants comme le readme et le claude.md.

J'étais entrain de réaliser des modifications avec claude code mais le travail a été intérompu alors nous allons continuer le travail ici. Tu peux lire les fichiers modifiés dans le dernier commit car c'est probablement ceux là que tu devras modifier.

L'application à l'air de bien fonctionner sauf que :
Il faut ajouter pour les taches, le status "pret" et le trie doit se faire ainsi pour les groupes de taches dans l'ordre :
brouillon
pour IA
collecte

puis après collecte pour les taches avec le status pret :
en retard
aujourd'hui
demain
sans date mais trié par importance
avec date dans le futur

Une fois la modification prête demande moi de tester à la main l'application et on va refaire fonctionner les test (npm run test) après ma confirmation.

---

- vérifier l'export import csv

Peux tu maintenant vérifier que l'export / import csv fonctionne puis npm run test et npm run build il faut que tout fonctionne bien.

- api pour IA externe genre openclaw ou hermes agent + chatbot api key openrouter

J'utilise OpenClaw et Hermes agent sur le serveur sur lequel nous allons mettre ne production cette application.
Peux tu me faire un plan car j'aimerais que OpenClaw ou Hermes puisse create, remove et modifier des taches facilement. Comment leur donner accès à cela de la meilleure façon ? En vrai je pense qu'ils peuvent utiliser l'api existante mais je me demande s'il n'est pas mieux de faire autrement, peut être via un mcp serveur ? Je ne sais pas trop mais idéalement il faut que ce soit futurproof c'est dire que si plus tarde cette application devient un saas, il faudra que les utilisateurs puissent facilement se connecter dessus avec leur OpenClaw, Hermes ou autre agent IA. Cela pourrait d'ailleurs aussi être claude code peut etre ? Que me conseilles tu ? Fais un plan.

- mise en prod serveur (préparer doc avant)
- test avec hermes
