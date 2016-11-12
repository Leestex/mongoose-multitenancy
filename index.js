const mongoose = require('mongoose')
const express = require('express')
const Task = require('./task')
const proxy = require('./proxy')
const connLike = require('./conn-like')
const Ability = require('./ability/ability')
const Accessible = require('./ability/mongoose-accessible')

const connType = connLike

const rulesMap = {
  all: [
    {
      disallowed: true,
      subject: 'Task',
      actions: 'delete',
      conditions: {
        private: true
      }
    }
  ],

  admin: [
    {
      subject: 'all',
      actions: 'manage',
      conditions: {
        tenantId: 1
      }
    }
  ],
  user: [
    {
      subject: 'all',
      actions: 'manage',
      conditions: {
        tenantId: 2
      }
    }
  ],
  franchise: [
    {
      subject: 'all',
      actions: 'manage',
      conditions: {
        tenantId: 3
      }
    },
    {
      subject: 'Task',
      actions: 'manage',
      conditions: {
        tenantId: [1, 2],
      }
    },
    {
      disallowed: true,
      subject: 'Task',
      actions: 'manage',
      conditions: {
        private: true
      }
    }
  ],
}

const connections = {}
function createConnectionFor(id) {
  if (!connections[id]) {
    connections[id] = connType.create(mongoose.connection, id)
  }

  return connections[id]
}

mongoose.set('debug', true)
mongoose.plugin(Accessible)
mongoose.connect('mongodb://localhost/tenant')
const TaskModel = mongoose.model('Task', Task.schema)

const app = express()
app.set('json spaces', 2);
app.use((req, res, next) => {
  const rules = rulesMap[req.query.user]

  if (!rules) {
    return res.status(403).send({
      message: `unexpected value for "user" query parameter: ${req.query.user}
      Possible options: admin, user, franchise`
    })
  }

  req.ability = new Ability(rulesMap.all.concat(rules))
  next()
})

app.use((req, res, next) => {
  if (!req.query.deleteId) {
    return next()
  }

  TaskModel.findOne({ _id: req.query.deleteId }).then(task => {
    res.send({
      task,
      canDeleteTask: req.ability.can('delete', task)
    })
  })
})

app.use((req, res) => {
  TaskModel.accessibleBy(req.ability)
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


// create conn-like+
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
