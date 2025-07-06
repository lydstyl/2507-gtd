# 🚀 Guide de déploiement en production

## 📋 Prérequis

### Serveur

- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : Minimum 2GB (recommandé 4GB+)
- **Stockage** : 20GB+
- **Node.js** : Version 18+ (LTS)
- **PostgreSQL** : Version 13+

### Domaine

- Un nom de domaine (ex: `gtd.mondomaine.com`)
- Certificat SSL (Let's Encrypt recommandé)

## 🔧 Installation sur le serveur

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Installation de PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installation de Nginx
sudo apt install nginx -y

# Installation de Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuration de PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE gtd_production;
CREATE USER gtd_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE gtd_production TO gtd_user;
\q
```

### 3. Configuration des variables d'environnement

Créer le fichier `/home/ubuntu/gtd-app/backend/.env` :

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://gtd_user:votre_mot_de_passe_securise@localhost:5432/gtd_production"
JWT_SECRET="votre_jwt_secret_tres_long_et_complexe"
CORS_ORIGIN="https://gtd.mondomaine.com"
LOG_LEVEL="info"
```

### 4. Déploiement de l'application

```bash
# Cloner le projet (ou copier les fichiers)
git clone https://github.com/lydstyl/2507-gtd.git
cd 2507-gtd

# Installer les dépendances
npm run install:all

# Build de l'application
./deploy.sh

# Copier les fichiers de production
sudo mkdir -p /var/www/gtd-app
sudo cp -r backend/dist /var/www/gtd-app/backend
sudo cp -r frontend/dist /var/www/gtd-app/frontend
sudo cp backend/package.json /var/www/gtd-app/backend/
sudo cp backend/ecosystem.config.js /var/www/gtd-app/backend/

# Installer les dépendances de production
cd /var/www/gtd-app/backend
npm install --production
```

### 5. Configuration de PM2

```bash
# Aller dans le répertoire backend
cd /var/www/gtd-app/backend

# Démarrer l'application avec PM2
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

### 6. Configuration de Nginx

Créer le fichier `/etc/nginx/sites-available/gtd-app` :

```nginx
server {
    listen 80;
    server_name gtd.mondomaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gtd.mondomaine.com;

    # Certificat SSL (à configurer avec Certbot)
    ssl_certificate /etc/letsencrypt/live/gtd.mondomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gtd.mondomaine.com/privkey.pem;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend React
    location / {
        root /var/www/gtd-app/frontend;
        try_files $uri $uri/ /index.html;

        # Cache pour les assets statiques
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Logs
    access_log /var/log/nginx/gtd-app.access.log;
    error_log /var/log/nginx/gtd-app.error.log;
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/gtd-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configuration SSL avec Let's Encrypt

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d gtd.mondomaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter cette ligne :
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Migration de la base de données

```bash
cd /var/www/gtd-app/backend

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

## 🔄 Mise à jour de l'application

### Script de mise à jour automatique

Créer `/home/ubuntu/update-gtd.sh` :

```bash
#!/bin/bash
cd /home/ubuntu/2507-gtd

# Pull des dernières modifications
git pull origin main

# Build de l'application
./deploy.sh

# Copier les nouveaux fichiers
sudo cp -r backend/dist/* /var/www/gtd-app/backend/
sudo cp -r frontend/dist/* /var/www/gtd-app/frontend/

# Redémarrer l'application
cd /var/www/gtd-app/backend
pm2 restart gtd-backend

echo "✅ Application mise à jour avec succès!"
```

Rendre le script exécutable :

```bash
chmod +x /home/ubuntu/update-gtd.sh
```

## 📊 Monitoring et logs

### PM2

```bash
# Voir les processus
pm2 status

# Voir les logs
pm2 logs gtd-backend

# Monitorer en temps réel
pm2 monit
```

### Nginx

```bash
# Voir les logs d'accès
sudo tail -f /var/log/nginx/gtd-app.access.log

# Voir les logs d'erreur
sudo tail -f /var/log/nginx/gtd-app.error.log
```

## 🔒 Sécurité

### Firewall

```bash
# Installer UFW
sudo apt install ufw

# Configuration de base
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Activer le firewall
sudo ufw enable
```

### Sauvegarde automatique

Créer `/home/ubuntu/backup-gtd.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
pg_dump gtd_production > $BACKUP_DIR/gtd_db_$DATE.sql

# Sauvegarde des fichiers
tar -czf $BACKUP_DIR/gtd_files_$DATE.tar.gz /var/www/gtd-app

# Supprimer les sauvegardes de plus de 7 jours
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Sauvegarde terminée: $DATE"
```

Ajouter au crontab :

```bash
sudo crontab -e
# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin :
# 0 2 * * * /home/ubuntu/backup-gtd.sh
```

## 🚨 Dépannage

### Problèmes courants

1. **L'application ne démarre pas**

   ```bash
   pm2 logs gtd-backend
   # Vérifier les variables d'environnement
   cat /var/www/gtd-app/backend/.env
   ```

2. **Erreur de base de données**

   ```bash
   # Vérifier la connexion PostgreSQL
   sudo -u postgres psql -d gtd_production
   ```

3. **Erreur Nginx**

   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Certificat SSL expiré**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

## 📞 Support

En cas de problème :

1. Vérifier les logs PM2 : `pm2 logs gtd-backend`
2. Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/gtd-app.error.log`
3. Vérifier le statut des services : `sudo systemctl status nginx postgresql`

---

**🎉 Félicitations ! Ton application GTD est maintenant en production !**
