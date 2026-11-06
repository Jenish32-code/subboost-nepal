import { GRADIENTS } from './constants'

export const npr = (value) =>
  'NPR ' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const coins = (value) => Number(value || 0).toLocaleString('en-IN')

export const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts[0][0].toUpperCase()
}

export const gradientFor = (seed = '') => {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  return GRADIENTS[hash % GRADIENTS.length]
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export const taskCode = () =>
  'SB-' +
  Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

export const receiptCode = () => String(Math.floor(1000 + Math.random() * 9000))

export const otpCode = () => String(Math.floor(1000 + Math.random() * 9000))

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export const isYoutubeUrl = (value = '') => {
  try {
    const url = new URL(normalizeUrl(value))
    return /(^|\.)youtube\.com$/.test(url.hostname) || /(^|\.)youtu\.be$/.test(url.hostname)
  } catch {
    return false
  }
}

export const normalizeUrl = (value = '') => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Best-effort readable channel name from a YouTube URL. */
export const channelNameFromUrl = (value = '') => {
  try {
    const url = new URL(normalizeUrl(value))
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments[0]?.startsWith('@')) return prettify(segments[0].slice(1))
    if (segments[0] === 'channel' || segments[0] === 'c' || segments[0] === 'user') {
      return prettify(segments[1] || '')
    }
    if (url.hostname.includes('youtu.be')) return 'YouTube Channel'
    return prettify(segments[0] || '')
  } catch {
    return ''
  }
}

const prettify = (raw = '') => {
  const cleaned = decodeURIComponent(raw).replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'YouTube Channel'
  return cleaned
    .split(' ')
    .map((word) => (word.length > 2 ? word[0].toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(' ')
}

/** Resize an uploaded image to a small preview data URL so localStorage stays light. */
export const fileToThumbnail = (file, maxSize = 520) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('That file is not a valid image.'))
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: canvas.toDataURL('image/jpeg', 0.72),
        })
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}
