import app from './app'

// Validation des variables d'environnement requises
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes :', missingVars.join(', '));
  console.error('📝 Copiez .env.example vers .env et configurez les valeurs');
  console.error('💡 Exemple : cp .env.example .env');
  process.exit(1);
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📖 API Documentation available at http://localhost:${PORT}`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
})
