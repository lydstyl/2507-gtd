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

/**
 * HTML d'insertion dans la note selon le type de fichier :
 *  - audio  → <audio controls>
 *  - vidéo  → <video controls>
 *  - PDF    → <a target="_blank"> (ouvert dans un nouvel onglet)
 * Le token est ajouté en query string (cf imageSrcWithToken), comme pour les <img>.
 */
export function fileEmbedHtml(file: File, url: string): string {
  const src = imageSrcWithToken(url)
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const name = esc(file.name || 'fichier')
  if (file.type.startsWith('audio/')) {
    return `<audio controls src="${src}" title="${name}"></audio>`
  }
  if (file.type.startsWith('video/')) {
    return `<video controls src="${src}" style="max-width:100%"></video>`
  }
  // PDF (ou tout le reste) → lien cliquable, nouvel onglet
  return `<a href="${src}" target="_blank" rel="noopener">${name}</a>`
}
