var actionAliases = {
  manage: 'create read update delete'.split(' ')
}

function ruleId(subject, action) {
  return subject + '_' + action
}

function normalizeActions(actionOrAlias) {
  if (typeof actionOrAlias === 'string') {
    actionOrAlias = actionOrAlias.split(' ')
  }

  return actionOrAlias.reduce((aliases, alias) => {
    var actions = normalizeActions(actionAliases[alias] || [])
    return aliases.concat(actions)
  }, actionOrAlias)
}

function sortBy(rules, field) {
  return rules.slice(0).sort((ruleLeft, ruleRight) => {
    if (ruleLeft[field] === ruleRight[field]) {
      return 0
    }

    return ruleLeft[field] > ruleRight[field] ? 1 : -1
  })
}

function createIndexFor(array) {
  return array.reduce((object, item) => {
    object[item] = true
    return object
  }, {})
}

const EMPTY_OBJECT = {}

class Rule {
  constructor(rule) {
    this.disallowed = false
    this.conditions = EMPTY_OBJECT
    Object.assign(this, rule)
    this.actions = normalizeActions(rule.actions)

    if (Array.isArray(rule.fields)) {
      this.fieldMatcher = rule.disallowed ? 'some' : 'every'
      this.fields = createIndexFor(rule.fields)
    }
  }
}

class Ability {
  // TODO: Update _parsedRules with new alias on alias add.
  static addAlias(alias, actions) {
    if (!Array.isArray(actions)) {
      throw new Error('Ability.addAlias expects second argument to be an array of actions.')
    }

    actionAliases[alias] = actions
  }

  constructor(rules) {
    this._parsedRules = {}

    if (rules) {
      this.setRules(rules)
    }
  }

  setRules(rules) {
    if (!Array.isArray(rules)) {
      throw new Error('Ability.setRules expects first argument to be an array of rules.')
    }

    this._parsedRules = this.parse(rules)

    return this
  }

  parse(rules) {
    return sortBy(rules, 'disallowed').reduce((rulesMap, originalRule) => {
      const rule = new Rule(originalRule)

      rule.actions.forEach(actionOrAlias => {
        const id = ruleId(rule.subject, actionOrAlias)
        rulesMap[id] = id in rulesMap ? rulesMap[id] : []
        rulesMap[id].push(rule)
      })

      return rulesMap
    }, {})
  }

  can(actionOrAlias, resource) {
    if (!actionOrAlias || !resource) {
      return false
    }

    const subject = String(resource.constructor.modelName || resource.constructor.name || resource)
    const rule = this.rulesFor(actionOrAlias, subject).find(rule => {
      return this.isSatisfiedConditions(rule.conditions, resource) && this.canHaveFields(rule, resource)
    }, this)

    return !!(rule && !rule.disallowed)
  }

  rulesFor(actionOrAlias, subject) {
    const subjectRules = this._parsedRules[ruleId(subject, actionOrAlias)] || []
    const allSubjectRules = this._parsedRules[ruleId('all', actionOrAlias)] || []

    return subjectRules.concat(allSubjectRules)
  }

  isSatisfiedConditions(conditions, resource) {
    return Object.keys(conditions).every(fieldName => {
      const conditionValue = conditions[fieldName]
      const value = resource[fieldName]

      if (Array.isArray(conditionValue)) {
        return conditionValue.include(value)
      }

      if (Array.isArray(value)) {
        return value.include(conditionValue)
      }

      return conditionValue === value
    })
  }

  canHaveFields(resource, rule) {
    if (!rule.fields) {
      return true
    }

    if (typeof resource === 'string') {
      return false
    }

    const fieldNames = Object.keys(resouce)

    return fieldNames[rule.fieldMatcher](fieldName => fieldName in rule.fields)
  }
}

module.exports = Ability
