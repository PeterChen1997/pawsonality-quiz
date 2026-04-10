const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }

export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config) {
  const dpr = 2
  const W = 720
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const footer = config.display.shareFooter || '爪格实验室 · 宠物人格测试'
  const owner = config.display.ownerLabel || ''
  const kickerText = mode === 'drunk'
    ? config.quiz.specialKicker
    : mode === 'fallback'
      ? config.quiz.fallbackKicker
      : config.quiz.normalKicker

  ctx.fillStyle = '#fff8f2'
  ctx.fillRect(0, 0, W, H)

  const cardX = 32, cardY = 32, cardW = W - 64, cardH = H - 64
  roundRect(ctx, cardX, cardY, cardW, cardH, 24)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  let y = cardY + 48
  ctx.textAlign = 'center'
  ctx.font = '700 20px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#d97757'
  ctx.fillText('🐾 爪格实验室', W / 2, y)
  y += 42

  ctx.font = '400 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText(kickerText, W / 2, y)
  y += 56

  ctx.font = '900 72px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8f4f3f'
  ctx.fillText(primary.code, W / 2, y)
  y += 40

  ctx.font = '600 32px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#3f2e2a'
  ctx.fillText(primary.cn, W / 2, y)
  y += 36

  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  ctx.font = '500 20px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const badgeW = ctx.measureText(badgeText).width + 40
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 36, 18)
  ctx.fillStyle = '#fde8df'
  ctx.fill()
  ctx.fillStyle = '#8f4f3f'
  ctx.fillText(badgeText, W / 2, y + 6)
  y += 44

  ctx.font = 'italic 600 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#3f2e2a'
  const introLines = wrapText(ctx, primary.intro || '', cardW - 80)
  for (const line of introLines) {
    ctx.fillText(line, W / 2, y)
    y += 30
  }
  y += 16

  const radarCx = W / 2
  const radarCy = y + 150
  const radarR = 130
  drawShareRadar(ctx, radarCx, radarCy, radarR, userLevels, dimOrder, dimDefs)
  y = radarCy + radarR + 40

  ctx.textAlign = 'left'
  const barX = cardX + 48
  const barMaxW = cardW - 96
  const dimNameW = 130
  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const val = LEVEL_NUM[level]
    const def = dimDefs[dim]
    if (!def) continue

    ctx.font = '600 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#3f2e2a'
    ctx.fillText(def.name.replace(/^[A-Za-z0-9]+\s*/, ''), barX, y)

    const progX = barX + dimNameW
    const progW = barMaxW - dimNameW - 50
    const progH = 12
    roundRect(ctx, progX, y - 10, progW, progH, 6)
    ctx.fillStyle = '#fdeee8'
    ctx.fill()

    roundRect(ctx, progX, y - 10, (val / 3) * progW, progH, 6)
    ctx.fillStyle = val === 3 ? '#d97757' : val === 2 ? '#8f4f3f' : '#c89b3c'
    ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = '600 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = val === 3 ? '#d97757' : val === 2 ? '#8f4f3f' : '#c89b3c'
    ctx.fillText(LEVEL_LABEL[level], barX + barMaxW, y)
    ctx.textAlign = 'left'
    y += 26
  }

  y += 18
  ctx.textAlign = 'center'
  ctx.font = '500 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a6f67'
  ctx.fillText(owner, W / 2, H - 66)
  ctx.font = '400 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#b4998f'
  ctx.fillText(footer, W / 2, H - 36)

  const link = document.createElement('a')
  link.download = `pawsonality-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
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

  ctx.font = '400 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
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

    const lr = maxR + 24
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    ctx.fillStyle = '#8a6f67'
    ctx.fillText((dimDefs[dimOrder[i]]?.name || dimOrder[i]).replace(/^[A-Za-z0-9]+\s*/, ''), lx, ly)
  }

  const values = dimOrder.map((d) => LEVEL_NUM[userLevels[d]] || 2)
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
