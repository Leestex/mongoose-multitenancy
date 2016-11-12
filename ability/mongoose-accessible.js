module.exports = function accessibleMiddleware(schema) {
  schema.statics.accessibleBy = accessibleBy
}

function accessibleBy(ability) {
  const rules = ability.rulesFor('read', this.modelName)

  return this.find(rulesToQuery(rules))
}

function rulesToQuery(rules) {
  let query = {}

  // TODO: need to consider tricky/conflicting rules resolution
  rules.forEach(rule => {
    const $in = ruleOperator(rule, '$in')
    const $eq = ruleOperator(rule, '$eq')

    Object.keys(rule.conditions).forEach(fieldName => {
      const value = rule.conditions[fieldName]

      if (fieldName in query) {
        const queryValue = query[fieldName]

        if (!queryValue[$in]) {
          query[fieldName] = { [$in]: [ queryValue[$eq] ] }
        }

        queryValue[$in] = queryValue[$in].concat(value)
      } else {
        if (Array.isArray(value)) {
          query[fieldName] = { [$in]: value }
        } else {
          query[fieldName] = { [$eq]: value }
        }
      }
    }, query)
  })

  return query
}

const INVERSE_OPERATOR_MAP = {
  $in: '$nin',
  $eq: '$ne'
}

function ruleOperator(rule, operator) {
  return rule.disallowed ? INVERSE_OPERATOR_MAP[operator] : operator
}
