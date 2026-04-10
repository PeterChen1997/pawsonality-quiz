import { shuffle, insertAtRandom, insertAfter } from './utils.js'

/**
 * 答题控制器
 */
export function createQuiz(onComplete) {
  let activeBank = null
  let specialMap = new Map()
  let queue = []
  let current = 0
  let answers = {}
  let specialResultCode = null

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    qText: document.getElementById('question-text'),
    options: document.getElementById('options'),
  }

  function totalCount() {
    return queue.length
  }

  function updateProgress() {
    const total = totalCount()
    const pct = total === 0 ? 0 : (current / total) * 100
    els.fill.style.width = pct + '%'
    els.text.textContent = `${current} / ${total}`
  }

  function renderQuestion() {
    const q = queue[current]
    if (!q) return

    els.qText.textContent = q.text
    els.options.innerHTML = ''

    q.options.forEach((opt) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn-option'
      btn.textContent = opt.label
      btn.addEventListener('click', () => selectOption(q, opt))
      els.options.appendChild(btn)
    })

    updateProgress()
  }

  function applyBranching(question, option) {
    if (question.nextId && question.insertOnValues?.includes(option.value) && !queue.some((q) => q.id === question.nextId)) {
      const followUp = specialMap.get(question.nextId)
      if (followUp) queue = insertAfter(queue, question.id, followUp)
    }

    if (question.activatesResultCode && question.activatesResultCodeOnValues?.includes(option.value)) {
      specialResultCode = question.activatesResultCode
    }
  }

  function selectOption(question, option) {
    answers[question.id] = option.value
    applyBranching(question, option)

    current++
    if (current >= totalCount()) {
      onComplete({
        answers,
        specialResultCode,
        bank: activeBank,
      })
    } else {
      renderQuestion()
    }
  }

  function buildQueue(bank) {
    const alwaysAsk = (bank.special || []).filter((q) => q.alwaysAsk)
    let prepared = shuffle(bank.main)

    for (const question of alwaysAsk) {
      prepared = insertAtRandom(prepared, question)
    }

    return prepared
  }

  function start(bank) {
    activeBank = bank
    specialMap = new Map((bank.special || []).map((q) => [q.id, q]))
    queue = buildQueue(bank)
    current = 0
    answers = {}
    specialResultCode = null
    renderQuestion()
  }

  return { start }
}
