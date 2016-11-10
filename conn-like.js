const mongoTenant = require('mongo-tenant')

module.exports = { create, findTasks }

class Connection {
  constructor(nativeConn, tenantId) {
    this.nativeConn = nativeConn
    this.tenantId = tenantId
  }

  model(name) {
    const model = this.nativeConn.model(name)

    return model.byTenant ? model.byTenant(this.tenantId) : model
  }

  build(name, ...args) {
    return new this.model(name)(...args)
  }
}

function create(connection, id) {
  return new Connection(connection, id)
}

function findTasks(req) {
  if (req.query.private) {
    return req.conn.model('Task').findPrivate()
  }

  return req.conn.model('Task').find()
}
