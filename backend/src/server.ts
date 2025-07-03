import app from './app'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📖 API Documentation available at http://localhost:${PORT}`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
})
