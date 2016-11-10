module.exports = { create, findTasks }

function create(conn, tenantId) {
  return addMethods(conn, tenantId, new Proxy(conn, {
    get(target, name) {
      const methodName = `__${name}`

      if (this[methodName]) {
        return this[methodName]
      }

      return this[methodName] = function(modelName, ...args) {
        const model = target.models[modelName]

        if (typeof model[name] !== 'function') {
          return Promise.reject(new Error(`"${name}" is not a static member of "${modelName}"`))
        }

        if (typeof args[0] === 'string') {
          args[0] = { _id: args[0] }
        } else {
          args[0] = args[0] || {}
        }

        args[0].tenantId = tenantId

        return model[name].apply(model, args)
      }
    }
  }))
}

function findTasks(req) {
  if (req.query.private) {
    return req.conn.findPrivate('Task')
  }

  return req.conn.find('Task')
}

function addMethods(conn, tenantId, proxy) {
  proxy.build = function(name, attrs = {}) {
    const Model = conn.model(name)
    const model = new Model(attrs)

    return Object.defineProperty(model, 'tenantId', {
      value: tenantId
    })
  }

  proxy.save = function(model) {
    model.tenantId = tenantId

    return model.save()
  }

  return proxy
}
