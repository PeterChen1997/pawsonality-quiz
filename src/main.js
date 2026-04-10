import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'
import './style.css'

async function loadJSON(path) {
  const res = await fetch(path)
  return res.json()
}

function applyBranding(config) {
  const { display, quiz } = config
  document.title = display.title

  const descMeta = document.querySelector('meta[name="description"]')
  if (descMeta) descMeta.setAttribute('content', display.subtitle)

  document.getElementById('intro-title').textContent = display.title
  document.getElementById('intro-subtitle').textContent = display.subtitle
  document.getElementById('btn-start').textContent = display.cta
  document.getElementById('intro-note').textContent = display.introNote
  document.getElementById('intro-owner').textContent = display.ownerLabel
  document.getElementById('deploy-command').textContent = display.deployCommand
  document.getElementById('deploy-hint').textContent = display.deployHint
  document.getElementById('upload-label').textContent = quiz.sharePhotoLabel

  ;['intro-source', 'result-source'].forEach((id) => {
    const el = document.getElementById(id)
    el.textContent = display.source
    el.href = display.sourceUrl
  })

  document.getElementById('result-owner').textContent = display.ownerLabel
  document.getElementById('radar-title').textContent = display.radarTitle
  document.getElementById('top-title').textContent = display.topListTitle
}

function getSpeciesStartLabel(species) {
  return species === 'cat' ? '开始给猫猫测爪格' : '开始给狗狗测爪格'
}

function resolveSpecialResultCode(answers, bank, fallbackSpecialCode = null) {
  const rules = bank.specialRules || []
  const matchedRule = rules.find((rule) =>
    (rule.all || []).every((condition) => condition.values?.includes(answers[condition.id]))
  )

  if (matchedRule?.code) return matchedRule.code
  if (rules.length) return null
  return fallbackSpecialCode
}

/** 模拟计数器：小种子 + localStorage 缓慢增长 */
function initCounter() {
  const SEED = 137
  const VERSION = 2          // bump to reset all clients
  const KEY = 'paw_counter'
  const KEY_VER = 'paw_counter_v'
  const KEY_TS = 'paw_counter_ts'
  const el = document.getElementById('intro-counter')
  if (!el) return

  const savedVer = parseInt(localStorage.getItem(KEY_VER), 10)
  let stored = parseInt(localStorage.getItem(KEY), 10)
  const lastTs = parseInt(localStorage.getItem(KEY_TS), 10)
  const now = Date.now()

  if (!stored || isNaN(stored) || savedVer !== VERSION) {
    stored = SEED + Math.floor(Math.random() * 20)
    localStorage.setItem(KEY_VER, String(VERSION))
  }

  // 每次访问 +1~2；如果距上次 >1 小时额外 +1~3
  stored += Math.floor(Math.random() * 2) + 1
  if (lastTs && now - lastTs > 3600000) {
    stored += Math.floor(Math.random() * 3) + 1
  }

  localStorage.setItem(KEY, String(stored))
  localStorage.setItem(KEY_TS, String(now))

  el.textContent = `已有 ${stored.toLocaleString()} 位铲屎官测过`
}

/** 解析 URL 中的邀请参数 */
function parseInviteParams() {
  const params = new URLSearchParams(window.location.search)
  const fromCode = params.get('from')
  const fromName = params.get('fn')
  const fromSpecies = params.get('species')
  if (fromCode && fromName) {
    return { code: fromCode, name: fromName, species: fromSpecies || 'dog' }
  }
  return null
}

/** 首页显示邀请 banner */
function showInviteBanner(inviteInfo) {
  const banner = document.getElementById('intro-invite-banner')
  if (!banner || !inviteInfo) return
  const speciesLabel = inviteInfo.species === 'cat' ? '猫猫' : '狗狗'
  banner.textContent = `你的朋友的${speciesLabel}是「${inviteInfo.code} ${inviteInfo.name}」，快来测测你的！`
  banner.style.display = ''
}

async function init() {
  const [questions, dimensions, types, config] = await Promise.all([
    loadJSON(new URL('../data/questions.json', import.meta.url).href),
    loadJSON(new URL('../data/dimensions.json', import.meta.url).href),
    loadJSON(new URL('../data/types.json', import.meta.url).href),
    loadJSON(new URL('../data/config.json', import.meta.url).href),
  ])

  applyBranding(config)
  initCounter()

  const inviteInfo = parseInviteParams()
  if (inviteInfo) showInviteBanner(inviteInfo)

  const pages = {
    intro: document.getElementById('page-intro'),
    quiz: document.getElementById('page-quiz'),
    result: document.getElementById('page-result'),
  }

  function showPage(name) {
    Object.values(pages).forEach((p) => p.classList.remove('active'))
    pages[name].classList.add('active')
    window.scrollTo(0, 0)
  }

  let selectedSpecies = 'dog'
  if (inviteInfo?.species) {
    selectedSpecies = inviteInfo.species
    const speciesButtons = document.querySelectorAll('[data-species]')
    speciesButtons.forEach((b) => {
      b.classList.toggle('is-selected', b.dataset.species === selectedSpecies)
    })
  }

  const dimOrder = dimensions.order

  function onQuizComplete({ answers, specialResultCode, bank }) {
    const scores = calcDimensionScores(answers, bank.main, dimOrder)
    const levels = scoresToLevels(scores, config.scoring.levelThresholds, dimOrder)
    const resolvedSpecialCode = resolveSpecialResultCode(answers, bank, specialResultCode)
    const result = determineResult(levels, dimOrder, types[selectedSpecies], types.shared.special, {
      specialResultCode: resolvedSpecialCode,
      fallbackThreshold: config.scoring.fallbackThreshold,
    })

    renderResult(result, levels, dimOrder, dimensions.definitions, config, selectedSpecies, inviteInfo)
    showPage('result')
  }

  const quiz = createQuiz(onQuizComplete)

  const startBtn = document.getElementById('btn-start')
  startBtn.textContent = getSpeciesStartLabel(selectedSpecies)

  const speciesButtons = document.querySelectorAll('[data-species]')
  speciesButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speciesButtons.forEach((b) => b.classList.remove('is-selected'))
      btn.classList.add('is-selected')
      selectedSpecies = btn.dataset.species
      startBtn.textContent = getSpeciesStartLabel(selectedSpecies)
    })
  })

  document.getElementById('btn-start').addEventListener('click', () => {
    quiz.start(questions[selectedSpecies])
    showPage('quiz')
  })

  document.getElementById('btn-restart').addEventListener('click', () => {
    quiz.start(questions[selectedSpecies])
    showPage('quiz')
  })

  const retryCta = document.getElementById('retry-cta')
  if (retryCta) {
    retryCta.addEventListener('click', () => {
      quiz.start(questions[selectedSpecies])
      showPage('quiz')
    })
  }
}

init()
