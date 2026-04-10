import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'
import './style.css'

async function loadJSON(path) {
  const res = await fetch(path)
  return res.json()
}

function applyBranding(config) {
  const { display } = config
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

  ;['intro-source', 'result-source'].forEach((id) => {
    const el = document.getElementById(id)
    el.textContent = display.source
    el.href = display.sourceUrl
  })

  document.getElementById('result-owner').textContent = display.ownerLabel
  document.getElementById('radar-title').textContent = display.radarTitle
  document.getElementById('top-title').textContent = display.topListTitle
}

async function init() {
  const [questions, dimensions, types, config] = await Promise.all([
    loadJSON(new URL('../data/questions.json', import.meta.url).href),
    loadJSON(new URL('../data/dimensions.json', import.meta.url).href),
    loadJSON(new URL('../data/types.json', import.meta.url).href),
    loadJSON(new URL('../data/config.json', import.meta.url).href),
  ])

  applyBranding(config)

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

  function onQuizComplete(answers, isDrunk) {
    const scores = calcDimensionScores(answers, questions.main)
    const levels = scoresToLevels(scores, config.scoring.levelThresholds)
    const result = determineResult(levels, dimensions.order, types.standard, types.special, { isDrunk })
    renderResult(result, levels, dimensions.order, dimensions.definitions, config)
    showPage('result')
  }

  const quiz = createQuiz(questions, config, onQuizComplete)

  document.getElementById('btn-start').addEventListener('click', () => {
    quiz.start()
    showPage('quiz')
  })

  document.getElementById('btn-restart').addEventListener('click', () => {
    quiz.start()
    showPage('quiz')
  })
}

init()
