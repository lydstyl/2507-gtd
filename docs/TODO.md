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

---

- vérifier l'export import csv

Peux tu maintenant vérifier que l'export / import csv fonctionne puis npm run test et npm run build il faut que tout fonctionne bien.

- api pour IA externe genre openclaw ou hermes agent + chatbot api key openrouter

J'utilise OpenClaw et Hermes agent sur le serveur sur lequel nous allons mettre ne production cette application.
Peux tu me faire un plan car j'aimerais que OpenClaw ou Hermes puisse create, remove et modifier des taches facilement. Comment leur donner accès à cela de la meilleure façon ? En vrai je pense qu'ils peuvent utiliser l'api existante mais je me demande s'il n'est pas mieux de faire autrement, peut être via un mcp serveur ? Je ne sais pas trop mais idéalement il faut que ce soit futurproof c'est dire que si plus tarde cette application devient un saas, il faudra que les utilisateurs puissent facilement se connecter dessus avec leur OpenClaw, Hermes ou autre agent IA. Cela pourrait d'ailleurs aussi être claude code peut etre ? Que me conseilles tu ? Fais un plan.

- mise en prod serveur (préparer doc avant)
- test avec hermes
