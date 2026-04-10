import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }
const RARITY_LABEL = { SSR: '极稀有 · SSR', SR: '稀有 · SR', R: '常见 · R' }
const RARITY_CLASS = { SSR: 'rarity-ssr', SR: 'rarity-sr', R: 'rarity-r' }

export function renderResult(result, userLevels, dimOrder, dimDefs, config, species, inviteInfo) {
  const { primary, secondary, rankings, mode } = result
  const { display, quiz } = config

  const kicker = document.getElementById('result-kicker')
  if (mode === 'special') kicker.textContent = quiz.specialKicker
  else if (mode === 'fallback') kicker.textContent = quiz.fallbackKicker
  else kicker.textContent = quiz.normalKicker

  // Rarity badge
  const rarityEl = document.getElementById('result-rarity')
  const rarity = primary.rarity || 'R'
  rarityEl.textContent = RARITY_LABEL[rarity] || RARITY_LABEL.R
  rarityEl.className = `result-rarity ${RARITY_CLASS[rarity] || RARITY_CLASS.R}`

  document.getElementById('result-code').textContent = primary.code
  document.getElementById('result-name').textContent = primary.cn
  document.getElementById('result-subtitle').textContent = primary.subtitle || ''
  document.getElementById('result-footnote').textContent = primary.footnote || ''
  document.getElementById('result-badge').textContent =
    `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/${dimOrder.length} 维` : '')
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''
  document.getElementById('result-deep-dive').textContent = primary.deepDive || ''
  document.getElementById('secondary-label').textContent = quiz.secondaryLabel

  const tagEl = document.getElementById('result-tags')
  tagEl.innerHTML = ''
  ;(primary.tags || []).forEach((tag) => {
    const item = document.createElement('span')
    item.className = 'result-tag'
    item.textContent = tag
    tagEl.appendChild(item)
  })

  const secEl = document.getElementById('result-secondary')
  if (secondary && (mode === 'special' || mode === 'fallback')) {
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
  rankings.slice(0, 5).forEach((type, index) => {
    const item = document.createElement('div')
    item.className = 'top-item'
    item.innerHTML = `
      <span class="top-rank">#${index + 1}</span>
      <div class="top-copy">
        <div class="top-title-line">
          <span class="top-code">${type.code}</span>
          <span class="top-name">${type.cn}</span>
          ${type.rarity ? `<span class="top-rarity ${RARITY_CLASS[type.rarity] || ''}">${type.rarity}</span>` : ''}
        </div>
        <div class="top-subtitle">${type.subtitle || ''}</div>
      </div>
      <span class="top-sim">${type.similarity}%</span>
    `
    topEl.appendChild(item)
  })

  document.getElementById('disclaimer').textContent = mode === 'normal' ? display.funNote : display.funNoteSpecial

  // Compare card
  renderCompareCard(primary, inviteInfo, config)

  // Invite button
  bindInviteButton(primary, species, config)

  // Retry CTA
  const retryCta = document.getElementById('retry-cta')
  if (retryCta) retryCta.textContent = quiz.retryText || '觉得不太准？换个心态再测一次'

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

function renderCompareCard(primary, inviteInfo, config) {
  const card = document.getElementById('compare-card')
  if (!card || !inviteInfo) {
    if (card) card.style.display = 'none'
    return
  }

  card.style.display = ''
  document.getElementById('compare-label').textContent = config.quiz.compareTitle || '你们的爪格对比'
  document.getElementById('compare-friend-label').textContent = config.quiz.friendResultLabel || '朋友的宠物'
  document.getElementById('compare-friend-code').textContent = inviteInfo.code
  document.getElementById('compare-friend-name').textContent = inviteInfo.name
  document.getElementById('compare-my-code').textContent = primary.code
  document.getElementById('compare-my-name').textContent = primary.cn
}

function bindInviteButton(primary, species, config) {
  const btn = document.getElementById('btn-invite')
  if (!btn) return

  const siteUrl = config.siteUrl || window.location.origin
  const inviteUrl = `${siteUrl}/?from=${encodeURIComponent(primary.code)}&fn=${encodeURIComponent(primary.cn)}&species=${species}`

  btn.textContent = config.quiz.inviteText || '邀请TA也来测'
  btn.onclick = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      btn.textContent = config.quiz.inviteCopiedText || '链接已复制！发给朋友吧'
      setTimeout(() => {
        btn.textContent = config.quiz.inviteText || '邀请TA也来测'
      }, 2500)
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
