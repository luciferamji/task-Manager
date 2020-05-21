const express = require('express')
const Task = require('../model/task')
const auth = require('../middleware/authtoken')

const taskRouter = express.Router()
taskRouter.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

taskRouter.get('/tasks', auth, async (req, res) => {
    try { const match={}

         if(req.query.completed)
          match.completed=req.query.completed=='true'
        //normal way
        //const tasks = await Task.find({owner:req.user._id})
        //linked way 
        await req.user.populate({
            path: 'mytasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip)
            }
            
        }).execPopulate()
        res.send(req.user.mytasks)
    } catch (e) {
        console.log(e)
        res.status(500).send("error")
    }
})

taskRouter.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        //const task = await Task.findById(_id)
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

taskRouter.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates!'
        })
    }

    try {
        const task = await Task.findOneAndUpdate({
            _id: req.params.id,
            owner: req.user._id
        }, req.body, {
            new: true,
            runValidators: true
        })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})
taskRouter.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOneAndDelete({
            _id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})
module.exports = taskRouter