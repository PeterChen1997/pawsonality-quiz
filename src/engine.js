/**
 * 爪格实验室评分引擎 — 纯函数，无 DOM 依赖
 */

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 按维度求平均分：每道题可同时影响多个维度
 * @param {Object} answers  { dog_q01: 2, dog_q02: 3, ... }
 * @param {Array} questions 当前物种的主问题库
 * @param {Array} dimOrder  固定维度顺序
 * @returns {Object} { S1: 2.33, S2: 1.67, ... }
 */
export function calcDimensionScores(answers, questions, dimOrder = []) {
  const sums = Object.fromEntries(dimOrder.map((dim) => [dim, 0]))
  const counts = Object.fromEntries(dimOrder.map((dim) => [dim, 0]))

  for (const q of questions) {
    const selectedValue = answers[q.id]
    if (selectedValue == null) continue

    const selectedOption = q.options.find((option) => option.value === selectedValue)
    if (!selectedOption?.effects) continue

    for (const [dim, score] of Object.entries(selectedOption.effects)) {
      sums[dim] = (sums[dim] || 0) + score
      counts[dim] = (counts[dim] || 0) + 1
    }
  }

  return Object.fromEntries(dimOrder.map((dim) => {
    if (!counts[dim]) return [dim, 2]
    return [dim, Number((sums[dim] / counts[dim]).toFixed(4))]
  }))
}

/**
 * 原始分 → L/M/H 等级
 * @param {Object} scores      { S1: 2.33, ... }
 * @param {Object} thresholds  { L: [1,1.67], M: [1.68,2.33], H: [2.34,3] }
 * @param {Array}  dimOrder    维度顺序
 * @returns {Object} { S1: 'H', S2: 'L', ... }
 */
export function scoresToLevels(scores, thresholds, dimOrder = []) {
  const levels = {}

  for (const dim of dimOrder) {
    const score = scores[dim]

    if (score == null) {
      levels[dim] = 'M'
    } else if (score <= thresholds.L[1]) {
      levels[dim] = 'L'
    } else if (score >= thresholds.H[0]) {
      levels[dim] = 'H'
    } else {
      levels[dim] = 'M'
    }
  }

  return levels
}

/**
 * 解析人格类型的 pattern 字符串
 * "HHH-HMH-MHH-HHH-MHM" → ['H','H','H','H','M','H',...]
 */
export function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('')
}

/**
 * pattern 字符串转维度等级对象
 * @param {string} pattern
 * @param {Array} dimOrder
 * @returns {Object}
 */
export function patternToLevels(pattern, dimOrder) {
  const chars = parsePattern(pattern)
  return Object.fromEntries(dimOrder.map((dim, index) => [dim, chars[index] || 'M']))
}

/**
 * 计算用户向量与类型 pattern 的曼哈顿距离
 * @param {Object} userLevels  { S1: 'H', S2: 'L', ... }
 * @param {Array}  dimOrder    ['S1','S2','S3','E1',...]
 * @param {string} pattern     "HHH-HMH-MHH-HHH-MHM"
 * @returns {{ distance: number, exact: number, similarity: number }}
 */
export function matchType(userLevels, dimOrder, pattern) {
  const typeLevels = parsePattern(pattern)
  let distance = 0
  let exact = 0

  for (let i = 0; i < dimOrder.length; i++) {
    const userVal = LEVEL_NUM[userLevels[dimOrder[i]]] || 2
    const typeVal = LEVEL_NUM[typeLevels[i]] || 2
    const diff = Math.abs(userVal - typeVal)
    distance += diff
    if (diff === 0) exact++
  }

  const maxDistance = dimOrder.length * 2
  const similarity = Math.max(0, Math.round((1 - distance / maxDistance) * 100))
  return { distance, exact, similarity }
}

/**
 * 匹配所有类型，排序，应用隐藏人格与混合人格
 * @param {Object} userLevels        { S1: 'H', ... }
 * @param {Array}  dimOrder          维度顺序
 * @param {Object} typeLibrary       { standard: [...], special: [...] }
 * @param {Array}  sharedSpecials    共享特殊类型
 * @param {Object} options           { specialResultCode, fallbackThreshold }
 * @returns {{ primary: Object, secondary: Object|null, rankings: Array, mode: string }}
 */
export function determineResult(userLevels, dimOrder, typeLibrary, sharedSpecials = [], options = {}) {
  const standardTypes = typeLibrary?.standard || []
  const specialTypes = [...(typeLibrary?.special || []), ...sharedSpecials]
  const fallbackThreshold = options.fallbackThreshold ?? 66

  const rankings = standardTypes.map((type) => ({
    ...type,
    ...matchType(userLevels, dimOrder, type.pattern),
  }))

  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity)

  const best = rankings[0] || null
  const fallback = specialTypes.find((type) => type.code === 'MIXI') || null

  if (options.specialResultCode && best) {
    const special = specialTypes.find((type) => type.code === options.specialResultCode)
    if (special) {
      return {
        primary: { ...special, similarity: best.similarity, exact: best.exact },
        secondary: best,
        rankings,
        mode: 'special',
      }
    }
  }

  if (best && fallback && best.similarity < fallbackThreshold) {
    return {
      primary: { ...fallback, similarity: best.similarity, exact: best.exact },
      secondary: best,
      rankings,
      mode: 'fallback',
    }
  }

  return {
    primary: best,
    secondary: rankings[1] || null,
    rankings,
    mode: 'normal',
  }
}
