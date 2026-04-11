export function getTypeAvatarUrl(species, code) {
  const safeCode = String(code || '').trim().toLowerCase()
  if (!safeCode) return ''

  const safeSpecies = species === 'cat' ? 'cat' : 'dog'
  const baseUrl = import.meta.env.BASE_URL || './'
  return new URL(`${baseUrl}type-avatars/${safeSpecies}-${safeCode}.png`, window.location.href).href
}
