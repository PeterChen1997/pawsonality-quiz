import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

export function renderResult(result, userLevels, dimOrder, dimDefs, config) {
  const { primary, secondary, rankings, mode } = result
  const { display, quiz } = config

  const kicker = document.getElementById('result-kicker')
  if (mode === 'drunk') kicker.textContent = quiz.specialKicker
  else if (mode === 'fallback') kicker.textContent = quiz.fallbackKicker
  else kicker.textContent = quiz.normalKicker

  document.getElementById('result-code').textContent = primary.code
  document.getElementById('result-name').textContent = primary.cn
  document.getElementById('result-badge').textContent =
    `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''
  document.getElementById('secondary-label').textContent = quiz.secondaryLabel

  const secEl = document.getElementById('result-secondary')
  if (secondary && (mode === 'drunk' || mode === 'fallback')) {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent = `${secondary.code}（${secondary.cn}）· 匹配度 ${secondary.similarity}%`
  } else {
    secEl.style.display = 'none'
  }

  const canvas = document.getElementById('radar-chart')
  drawRadar(canvas, userLevels, dimOrder, dimDefs)

  const detailEl = document.getElementById('dimensions-detail')
  detailEl.innerHTML = ''
  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const def = dimDefs[dim]
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'dim-row'
    row.innerHTML = `
      <div class="dim-header">
        <span class="dim-name">${def.name}</span>
        <span class="dim-level ${LEVEL_CLASS[level]}">${LEVEL_LABEL[level]}</span>
      </div>
      <div class="dim-desc">${def.levels[level]}</div>
    `
    detailEl.appendChild(row)
  }

  const topEl = document.getElementById('top-list')
  topEl.innerHTML = ''
  rankings.slice(0, 5).forEach((t, i) => {
    const item = document.createElement('div')
    item.className = 'top-item'
    item.innerHTML = `
      <span class="top-rank">#${i + 1}</span>
      <span class="top-code">${t.code}</span>
      <span class="top-name">${t.cn}</span>
      <span class="top-sim">${t.similarity}%</span>
    `
    topEl.appendChild(item)
  })

  document.getElementById('disclaimer').textContent = mode === 'normal' ? display.funNote : display.funNoteSpecial
  bindPhotoUploader()

  document.getElementById('btn-download').onclick = () => {
    generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config)
  }

  const btnAgent = document.getElementById('btn-agent')
  btnAgent.onclick = () => {
    navigator.clipboard.writeText(display.deployCommand).then(() => {
      btnAgent.textContent = '已复制!'
      setTimeout(() => { btnAgent.textContent = '复制一键部署命令' }, 2000)
    })
  }
}


function bindPhotoUploader() {
  const input = document.getElementById('pet-photo-input')
  const preview = document.getElementById('pet-photo-preview')
  if (!input || !preview) return

  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    preview.src = url
    preview.style.display = 'block'
    window.__PET_PHOTO_URL__ = url
  }
}
