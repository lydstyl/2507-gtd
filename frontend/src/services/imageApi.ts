// Upload d'images vers le backend GTD (/api/images) et URLs tokenisées
// pour insertion dans les notes (<img> ne peut pas porter de header auth).

const isProduction = import.meta.env.PROD
const apiPort = import.meta.env.VITE_API_PORT || (isProduction ? undefined : '3000')
const API_BASE_URL = isProduction ? '/api' : `http://localhost:${apiPort}/api`

export interface UploadedImage {
  url: string
  name: string
}

/**
 * Upload d'un fichier image (multipart, champ "files").
 * Retourne l'URL relative servie par le backend : /api/images/<uuid>.<ext>
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('files', file)

  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  })

  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const data = await response.json()
      message = data.error || message
    } catch {
      // pas de corps JSON
    }
    throw new Error(`Échec de l'upload de l'image : ${message}`)
  }

  const data = (await response.json()) as { images: UploadedImage[] }
  return data.images[0]
}

/**
 * Ajoute le token en query string pour que la balise <img> charge
 * l'image sans header Authorization.
 */
export function imageSrcWithToken(url: string): string {
  const token = localStorage.getItem('token')
  if (!token) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}token=${token}`
}
