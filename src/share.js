import qrcode from 'qrcode-generator'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const RARITY_DISPLAY = {
  SSR: { text: '极稀有 · SSR', color: '#b8860b', bg: '#fff8e6', border: '#e6c54d' },
  SR:  { text: '稀有 · SR',    color: '#8f4f3f', bg: '#fde8df', border: '#d9a899' },
  R:   { text: '常见 · R',     color: '#6b5c56', bg: '#f0e8e3', border: '#c9b9b0' },
}

export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config) {
  const dpr = 2
  const W = 720
  const PAD = 48          // card inner padding (horizontal)
  const CARD_MARGIN = 32  // card outer margin

  const footer = config.display.shareFooter || '爪格实验室 · 宠物人格测试'
  const owner = config.display.ownerLabel || ''
  const kickerText = mode === 'special'
    ? config.quiz.specialKicker
    : mode === 'fallback'
      ? config.quiz.fallbackKicker
      : config.quiz.normalKicker

  // ---- Pass 1: calculate total height ----
  let h = 0
  const petPhotoUrl = window.__PET_PHOTO_URL__

  h += 64                         // top padding
  h += 28                         // brand title
  h += 32                         // gap
  if (petPhotoUrl) h += 196 + 28  // photo + gap
  h += 24                         // kicker
  h += 24                         // gap
  h += 32                         // rarity badge
  h += 20                         // gap
  h += 78                         // big code
  h += 12                         // gap
  h += 36                         // cn name
  h += 16                         // gap
  h += 26                         // subtitle
  h += 24                         // gap
  h += 36                         // badge (match %)
  h += 24                         // gap
  h += 28 * 3 + 12               // footnote (max 3 lines) + gap
  h += 36 + 28                   // tags + gap

  // divider
  h += 24

  // radar section
  h += 135 + 118 + 40            // radar (cy offset + radius + bottom gap)
  h += 20                         // gap

  // bars
  h += dimOrder.length * 26 + 12 // bars + gap

  // divider
  h += 28

  // QR section
  h += 100 + 16                  // qr + gap
  h += 22                         // scan text
  h += 24                         // gap
  h += 22                         // owner
  h += 22                         // footer
  h += 48                         // bottom padding

  const cardH = h
  const H = cardH + CARD_MARGIN * 2

  // ---- Pass 2: draw ----
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, H)
  gradient.addColorStop(0, '#fff8f2')
  gradient.addColorStop(1, '#fff2ea')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, H)

  // Card
  const cardX = CARD_MARGIN
  const cardY = CARD_MARGIN
  const cardW = W - CARD_MARGIN * 2
  roundRect(ctx, cardX, cardY, cardW, cardH, 28)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  const contentW = cardW - PAD * 2
  let y = cardY + 64

  // Brand title
  ctx.textAlign = 'center'
  ctx.font = '700 22px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#d97757'
  ctx.fillText('爪格实验室', W / 2, y)
  y += 32 + 28

  // Pet photo (optional)
  if (petPhotoUrl) {
    const img = await loadImage(petPhotoUrl)
    const imgW = 196
    const imgH = 196
    const imgX = (W - imgW) / 2
    const imgY = y - 28
    roundRect(ctx, imgX, imgY, imgW, imgH, 28)
    ctx.save()
    ctx.clip()
    const sw = img.width
    const sh = img.height
    const targetRatio = imgW / imgH
    const sourceRatio = sw / sh
    let sx = 0, sy = 0, sWidth = sw, sHeight = sh
    if (sourceRatio > targetRatio) { sWidth = sh * targetRatio; sx = (sw - sWidth) / 2 }
    else { sHeight = sw / targetRatio; sy = (sh - sHeight) / 2 }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, imgX, imgY, imgW, imgH)
    ctx.restore()
    y += 196 + 28 - 28
  }

  // Kicker
  ctx.textAlign = 'center'
  ctx.font = '500 20px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText(kickerText, W / 2, y)
  y += 32

  // Rarity badge (always visible)
  const rarity = primary.rarity || 'R'
  const rd = RARITY_DISPLAY[rarity] || RARITY_DISPLAY.R
  ctx.font = '800 15px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  const rarityW = ctx.measureText(rd.text).width + 32
  const rarityH = 30
  const rarityX = (W - rarityW) / 2
  const rarityY = y - 18
  roundRect(ctx, rarityX, rarityY, rarityW, rarityH, 15)
  ctx.fillStyle = rd.bg
  ctx.fill()
  ctx.strokeStyle = rd.border
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = rd.color
  ctx.fillText(rd.text, W / 2, y)
  y += 28

  // Big code
  ctx.font = '900 72px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8f4f3f'
  ctx.fillText(primary.code, W / 2, y + 56)
  y += 78 + 12

  // CN name
  ctx.font = '700 32px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#3f2e2a'
  ctx.fillText(primary.cn, W / 2, y)
  y += 36 + 10

  // Subtitle
  ctx.font = '500 22px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText(primary.subtitle || '', W / 2, y)
  y += 26 + 20

  // Match badge
  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/${dimOrder.length} 维` : '')
  ctx.font = '500 20px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  const badgeW = ctx.measureText(badgeText).width + 40
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 36, 18)
  ctx.fillStyle = '#fde8df'
  ctx.fill()
  ctx.fillStyle = '#8f4f3f'
  ctx.fillText(badgeText, W / 2, y + 6)
  y += 36 + 20

  // Footnote
  ctx.font = 'italic 500 19px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#4b3732'
  const footnoteLines = wrapText(ctx, primary.footnote || '', contentW - 40)
  for (const line of footnoteLines.slice(0, 3)) {
    ctx.fillText(line, W / 2, y)
    y += 28
  }
  y += 12

  // Tags
  drawTagRow(ctx, primary.tags || [], W / 2, y)
  y += 36 + 12

  // Divider
  drawDivider(ctx, cardX + PAD, y, contentW)
  y += 24

  // Radar
  const radarCx = W / 2
  const radarCy = y + 135
  const radarR = 118
  drawShareRadar(ctx, radarCx, radarCy, radarR, userLevels, dimOrder, dimDefs)
  y = radarCy + radarR + 40

  // Dimension bars
  ctx.textAlign = 'left'
  const barX = cardX + PAD
  const barMaxW = contentW
  const dimNameW = 136

  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const val = LEVEL_NUM[level]
    const def = dimDefs[dim]
    if (!def) continue

    ctx.font = '600 15px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#3f2e2a'
    ctx.fillText(def.name.replace(/^[A-Za-z0-9]+\s*/, ''), barX, y)

    const progX = barX + dimNameW
    const progW = barMaxW - dimNameW - 52
    const progH = 10
    roundRect(ctx, progX, y - 9, progW, progH, 5)
    ctx.fillStyle = '#fdeee8'
    ctx.fill()

    roundRect(ctx, progX, y - 9, (val / 3) * progW, progH, 5)
    ctx.fillStyle = val === 3 ? '#d97757' : val === 2 ? '#8f4f3f' : '#c89b3c'
    ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = '600 13px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = val === 3 ? '#d97757' : val === 2 ? '#8f4f3f' : '#c89b3c'
    ctx.fillText(LEVEL_LABEL[level], barX + barMaxW, y)
    ctx.textAlign = 'left'
    y += 26
  }
  y += 4

  // Divider
  drawDivider(ctx, cardX + PAD, y, contentW)
  y += 28

  // QR code
  ctx.textAlign = 'center'
  const siteUrl = config.siteUrl || window.location.origin
  const qrSize = 100
  const qrX = W / 2 - qrSize / 2
  drawQrCode(ctx, siteUrl, qrX, y, qrSize)
  y += qrSize + 16

  ctx.font = '600 17px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText('扫码测你家毛孩子的爪格', W / 2, y)
  y += 30

  // Owner + footer
  ctx.font = '500 18px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText(owner, W / 2, y)
  y += 24
  ctx.font = '400 17px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#b4998f'
  ctx.fillText(footer, W / 2, y)

  // Export
  const link = document.createElement('a')
  link.download = `pawsonality-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function drawDivider(ctx, x, y, w) {
  ctx.save()
  ctx.strokeStyle = '#f0d9cf'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawQrCode(ctx, url, x, y, size) {
  // White background for QR
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - 6, y - 6, size + 12, size + 12)

  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()

  const moduleCount = qr.getModuleCount()
  const cellSize = size / moduleCount

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillStyle = '#3f2e2a'
        ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize + 0.5, cellSize + 0.5)
      }
    }
  }
}

function drawShareRadar(ctx, cx, cy, maxR, userLevels, dimOrder, dimDefs) {
  const n = dimOrder.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2

  for (let lv = 3; lv >= 1; lv--) {
    const r = (lv / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = lv === 3 ? 'rgba(217,119,87,0.06)' : lv === 2 ? 'rgba(217,119,87,0.04)' : 'rgba(217,119,87,0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(143,79,63,0.12)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.font = '400 11px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(143,79,63,0.1)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const lr = maxR + 22
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    ctx.fillStyle = '#8a6f67'
    ctx.fillText((dimDefs[dimOrder[i]]?.name || dimOrder[i]).replace(/^[A-Za-z0-9]+\s*/, ''), lx, ly)
  }

  const values = dimOrder.map((dim) => LEVEL_NUM[userLevels[dim]] || 2)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(217,119,87,0.2)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(143,79,63,0.7)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#8f4f3f'
    ctx.fill()
  }
}

function drawTagRow(ctx, tags, centerX, y) {
  if (!tags.length) return
  const visibleTags = tags.slice(0, 3)
  ctx.font = '600 15px "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif'
  const paddingX = 16
  const gap = 12
  const widths = visibleTags.map((tag) => ctx.measureText(tag).width + paddingX * 2)
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (visibleTags.length - 1)
  let x = centerX - totalWidth / 2

  visibleTags.forEach((tag, index) => {
    const width = widths[index]
    roundRect(ctx, x, y - 16, width, 32, 16)
    ctx.fillStyle = '#fff4ee'
    ctx.fill()
    ctx.fillStyle = '#8f4f3f'
    ctx.textAlign = 'center'
    ctx.fillText(tag, x + width / 2, y + 3)
    x += width + gap
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
