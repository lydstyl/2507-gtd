import { Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import multer from 'multer'

// Répertoire des uploads (volume Docker ./uploads → /app/uploads).
// Environnement UPLOADS_DIR pour surcharger (tests, dev local).
export const UPLOAD_DIR = process.env.UPLOADS_DIR || '/app/uploads'

// 100 Mo : assez pour de courtes vidéos / gros audio (les images restent minuscules).
const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_FILES = 10 // par requête

const EXT_BY_MIME: Record<string, string> = {
  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  // Audio
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  // Vidéo
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/x-matroska': 'mkv',
  'video/mpeg': 'mpg',
  'video/quicktime': 'mov',
  // PDF
  'application/pdf': 'pdf'
}

/**
 * POST /api/images — upload multipart (champ `files`, plusieurs fichiers).
 * Répond { images: [{ url, name }] } avec des URLs relatives /api/images/<filename>.
 */
export async function uploadImages(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Aucune image envoyée (champ "files")' })
      return
    }
    if (files.length > MAX_FILES) {
      res.status(400).json({ error: `Maximum ${MAX_FILES} images par envoi` })
      return
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    // filename déjà renommé par multer : <uuid>.<ext>
    const images = files.map((f) => ({
      url: `/api/images/${f.filename}`,
      name: f.originalname
    }))

    res.status(201).json({ images })
  } catch (error) {
    console.error('Erreur upload image:', error)
    res.status(500).json({ error: 'Échec de l\'upload' })
  }
}

/**
 * GET /api/images/:filename — sert l'image.
 * Auth : Bearer header (fetch) OU ?token=*** (<img> dans les notes —
 * impossible d'envoyer un header depuis une balise img).
 */
export async function getImage(req: Request, res: Response): Promise<void> {
  try {
    // path.basename = pas de ../ (traversal) possible
    const filename = path.basename(String(req.params.filename))
    if (!filename || filename === '.') {
      res.status(404).json({ error: 'Image introuvable' })
      return
    }
    const filePath = path.join(UPLOAD_DIR, filename)
    try {
      await fs.access(filePath)
    } catch {
      res.status(404).json({ error: 'Image introuvable' })
      return
    }
    res.sendFile(filePath)
  } catch (error) {
    console.error('Erreur lecture image:', error)
    res.status(500).json({ error: 'Échec de la lecture' })
  }
}

/**
 * Middleware multer : disque, noms <uuid>.<ext>, images seules, 20 Mo max.
 */
export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(UPLOAD_DIR, { recursive: true })
        .then(() => cb(null, UPLOAD_DIR))
        .catch((err) => cb(err, UPLOAD_DIR))
    },
    filename: (_req, file, cb) => {
      const ext = (EXT_BY_MIME[file.mimetype] || 'bin').replace(/\//g, '')
      cb(null, `${randomUUID()}.${ext}`)
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    const m = file.mimetype
    const ok =
      m.startsWith('image/') ||
      m.startsWith('audio/') ||
      m.startsWith('video/') ||
      m === 'application/pdf'
    if (ok) {
      cb(null, true)
    } else {
      cb(new Error(`Type non autorisé: ${m} (images, audio, vidéo, PDF uniquement)`))
    }
  }
})
