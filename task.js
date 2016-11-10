const mongoose = require('mongoose')
// const loadClass = require('mongoose-class-wrapper')
const mongoTenant = require('mongo-tenant')

class Task {
}

Task.schema = new mongoose.Schema({
  name: { type: String, required: true },
  tenantId: { type: Number }
})
// Task.schema.plugin(loadClass, Task);
Task.schema.plugin(mongoTenant)

Task.schema.static('findPrivate', function(conditions) {
  return this.find(Object.assign({ private: true }, conditions))
})

module.exports = Task
