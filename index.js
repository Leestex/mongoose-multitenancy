const mongoose = require('mongoose')
const express = require('express')
const Task = require('./task')
const proxy = require('./proxy')
const connLike = require('./conn-like')

const connType = connLike

const tenantsMap = {
  admin: 1,
  user: 2,
  member: 3,
}

const connections = {}
function createConnectionFor(id) {
  if (!connections[id]) {
    connections[id] = connType.create(mongoose.connection, id)
  }

  return connections[id]
}

mongoose.connect('mongodb://localhost/tenant')
mongoose.model('Task', Task.schema)

const app = express()
app.set('json spaces', 2);
app.use((req, res, next) => {
  req.tenantId = tenantsMap[req.query.user]
  req.conn = createConnectionFor(req.tenantId)
  next()
})
app.use((req, res) => {
  connType.findTasks(req)
    .then(tasks => {
      if (tasks === null) {
        res.status(404).send({ code: 'notFound' })
      } else {
        res.send(tasks)
      }
    })
    .catch(error => res.status(500).send({
      message: error.message,
      stack: error.stack.split('\n')
    }))
})

// create conn-like
// const task = req.conn.build('Task', { name: 'test' })
// task.value = 123
// task.save()
// const tasks = req.conn.model('Task').find()

// proxy
// const task = req.conn.build('Task', { name: 'test' })
// task.value = 123
// req.conn.save(task)
// const tasks = req.conn.find('Task')
//

app.listen(3000, () => {
  console.info('server is started on http://localhost:3000')
})
