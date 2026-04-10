import fs from 'node:fs/promises'
import process from 'node:process'
import { determineResult, parsePattern, patternToLevels } from '../src/engine.js'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const SPECIES = ['dog', 'cat']

const [dimensions, questions, types, config] = await Promise.all([
  readJson('../data/dimensions.json'),
  readJson('../data/questions.json'),
  readJson('../data/types.json'),
  readJson('../data/config.json'),
])

const errors = []
const summary = []
const dimOrder = dimensions.order

validateDimensions()
for (const species of SPECIES) {
  validateQuestionBank(species)
  validateTypeLibrary(species)
}

if (errors.length) {
  console.error('Validation failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Validation passed.\n')
for (const line of summary) {
  console.log(`- ${line}`)
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(new URL(path, import.meta.url), 'utf8'))
}

function validateDimensions() {
  const uniqueDims = new Set(dimOrder)
  const expectedDimCount = 15

  if (dimOrder.length !== expectedDimCount) {
    errors.push(`dimensions.order should contain ${expectedDimCount} items, found ${dimOrder.length}`)
  }

  if (uniqueDims.size !== dimOrder.length) {
    errors.push('dimensions.order contains duplicate dimension ids')
  }

  for (const dim of dimOrder) {
    if (!dimensions.definitions[dim]) {
      errors.push(`missing dimension definition for ${dim}`)
    }
  }

  for (const [modelCode, model] of Object.entries(dimensions.models)) {
    if ((model.dimensions || []).length !== 3) {
      errors.push(`model ${modelCode} should list exactly 3 dimensions`)
    }

    for (const dim of model.dimensions || []) {
      if (!uniqueDims.has(dim)) {
        errors.push(`model ${modelCode} references unknown dimension ${dim}`)
      }
    }
  }

  summary.push(`${dimOrder.length} dimensions registered across ${Object.keys(dimensions.models).length} models`)
}

function validateQuestionBank(species) {
  const bank = questions[species]
  const expectedQuestionCount = config.scoring.targetQuestionCount
  const ids = new Set()
  const dimCounts = Object.fromEntries(dimOrder.map((dim) => [dim, 0]))
  const availableSpecialCodes = new Set([
    ...(types[species]?.special || []).map((type) => type.code),
    ...(types.shared?.special || []).map((type) => type.code),
  ])

  if (!bank) {
    errors.push(`missing question bank for ${species}`)
    return
  }

  if ((bank.main || []).length !== expectedQuestionCount) {
    errors.push(`${species} main question count should be ${expectedQuestionCount}, found ${(bank.main || []).length}`)
  }

  for (const question of bank.main || []) {
    if (ids.has(question.id)) {
      errors.push(`${species} question id duplicated: ${question.id}`)
    }
    ids.add(question.id)

    validateQuestionOptions(question, species)

    if (question.activatesResultCode && !availableSpecialCodes.has(question.activatesResultCode)) {
      errors.push(`${species} question ${question.id} activates unknown result code ${question.activatesResultCode}`)
    }

    const coveredByQuestion = new Set()
    for (const option of question.options || []) {
      for (const [dim, score] of Object.entries(option.effects || {})) {
        if (!Object.prototype.hasOwnProperty.call(dimCounts, dim)) {
          errors.push(`${species} question ${question.id} references unknown dimension ${dim}`)
          continue
        }
        if (![1, 2, 3].includes(score)) {
          errors.push(`${species} question ${question.id} uses invalid score ${score} on ${dim}`)
        }
        coveredByQuestion.add(dim)
      }
    }

    if (coveredByQuestion.size < 3) {
      errors.push(`${species} question ${question.id} should influence at least 3 dimensions, found ${coveredByQuestion.size}`)
    }

    for (const dim of coveredByQuestion) {
      dimCounts[dim]++
    }
  }

  for (const [dim, count] of Object.entries(dimCounts)) {
    if (count < config.scoring.minimumDimensionCoverage) {
      errors.push(`${species} dimension ${dim} should be covered by at least ${config.scoring.minimumDimensionCoverage} questions, found ${count}`)
    }
  }

  const specialIds = new Set()
  for (const question of bank.special || []) {
    if (ids.has(question.id) || specialIds.has(question.id)) {
      errors.push(`${species} special question id duplicated: ${question.id}`)
    }
    specialIds.add(question.id)
    validateQuestionOptions(question, species)

    if (question.nextId && !(bank.special || []).some((item) => item.id === question.nextId)) {
      errors.push(`${species} special question ${question.id} points to missing nextId ${question.nextId}`)
    }

    if (question.activatesResultCode && !availableSpecialCodes.has(question.activatesResultCode)) {
      errors.push(`${species} special question ${question.id} activates unknown result code ${question.activatesResultCode}`)
    }
  }

  const coverageSummary = dimOrder.map((dim) => `${dim}:${dimCounts[dim]}`).join(' ')

  for (const rule of bank.specialRules || []) {
    if (!availableSpecialCodes.has(rule.code)) {
      errors.push(`${species} special rule references unknown result code ${rule.code}`)
    }
    for (const condition of rule.all || []) {
      const targetQuestion = (bank.main || []).find((question) => question.id === condition.id)
      if (!targetQuestion) {
        errors.push(`${species} special rule for ${rule.code} references unknown question ${condition.id}`)
        continue
      }
      const optionValues = new Set((targetQuestion.options || []).map((option) => option.value))
      for (const value of condition.values || []) {
        if (!optionValues.has(value)) {
          errors.push(`${species} special rule for ${rule.code} references missing option value ${value} on ${condition.id}`)
        }
      }
    }
  }

  summary.push(`${species}: ${(bank.main || []).length} main questions, ${(bank.special || []).length} special questions`)
  summary.push(`${species}: dimension coverage ${coverageSummary}`)
}

function validateQuestionOptions(question, species) {
  const values = (question.options || []).map((option) => option.value)

  if (!values.length) {
    errors.push(`${species} question ${question.id} has no options`)
    return
  }

  if (new Set(values).size !== values.length) {
    errors.push(`${species} question ${question.id} should use unique option values`)
  }

  for (const option of question.options || []) {
    if (!option.label) {
      errors.push(`${species} question ${question.id} has an option without label`)
    }
    if (!Number.isInteger(option.value)) {
      errors.push(`${species} question ${question.id} has a non-integer option value`)
    }
  }

  if (!question.activatesResultCode) {
    for (const option of question.options || []) {
      if (!option.effects || !Object.keys(option.effects).length) {
        errors.push(`${species} question ${question.id} should define scoring effects on every option`)
      }
    }
  }
}

function validateTypeLibrary(species) {
  const library = types[species]
  const codes = new Set()
  const patterns = []

  if (!library) {
    errors.push(`missing type library for ${species}`)
    return
  }

  for (const type of library.standard || []) {
    if (codes.has(type.code)) {
      errors.push(`${species} standard type code duplicated: ${type.code}`)
    }
    codes.add(type.code)

    const chars = parsePattern(type.pattern)
    if (chars.length !== dimOrder.length) {
      errors.push(`${species} type ${type.code} pattern should contain ${dimOrder.length} dimensions, found ${chars.length}`)
    }

    if (!(type.tags || []).length) {
      errors.push(`${species} type ${type.code} should expose tags for result rendering`)
    }

    const exactLevels = patternToLevels(type.pattern, dimOrder)
    const result = determineResult(exactLevels, dimOrder, library, types.shared.special, {
      fallbackThreshold: config.scoring.fallbackThreshold,
    })

    if (result.primary?.code !== type.code) {
      errors.push(`${species} type ${type.code} does not match itself exactly; got ${result.primary?.code || 'none'}`)
    }

    const runnerUp = result.rankings[1]
    if (runnerUp && runnerUp.distance < 2) {
      errors.push(`${species} type ${type.code} is too close to ${runnerUp.code}; runner-up distance is ${runnerUp.distance}`)
    }

    patterns.push(type)
  }

  const minPairwise = getMinPairwiseDistance(patterns)
  if (minPairwise && minPairwise.distance < 4) {
    errors.push(`${species} type library is too compressed; ${minPairwise.left} and ${minPairwise.right} are only distance ${minPairwise.distance} apart`)
  }

  summary.push(`${species}: ${(library.standard || []).length} standard results, min pairwise distance ${minPairwise?.distance ?? 'n/a'}`)
}

function getMinPairwiseDistance(list) {
  let best = null

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const left = parsePattern(list[i].pattern)
      const right = parsePattern(list[j].pattern)
      let distance = 0

      for (let k = 0; k < left.length; k++) {
        distance += Math.abs(LEVEL_NUM[left[k]] - LEVEL_NUM[right[k]])
      }

      if (!best || distance < best.distance) {
        best = {
          distance,
          left: list[i].code,
          right: list[j].code,
        }
      }
    }
  }

  return best
}
