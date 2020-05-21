const express = require('express')
const User = require('../model/user')
const serializeError = require('serialize-error');
const auth = require('../middleware/authtoken')
const multer = require('multer')
const sharp=require('sharp')
const userRouter = express.Router()
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (file.originalname.endsWith('.pdf'))
            return cb(new Error("upload file image"))

        return cb(undefined, true)
    }

})




//signup
userRouter.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()

        const token = await user.generateauthtoken()
        const userpp = await user.getpp()
        res.status(201).send({
            user: userpp,
            token
        })
    } catch (e) {
        res.status(400).send(e)
    }
})
//login
userRouter.get('/users/me', auth, async (req, res) => {
    try {

        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})



userRouter.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates!'
        })
    }

    try {
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        const user = req.user


        if (!user) {
            return res.status(404).send()
        }
        updates.forEach((update) => {
            user[update] = req.body[update]
        })
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})
userRouter.delete('/users/me', auth, async (req, res) => {


    try {
        // const user = await User.findByIdAndDelete(req.user._id)

        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()

        res.send(req.user)
    } catch (e) {
        res.status(500).send(serializeError(e).message)
    }
})
userRouter.post('/users/login', async (req, res) => {
    try {
        var user = await User.login(req.body.email, req.body.password)
        const token = await user.generateauthtoken()
        user = await user.getpp()
        res.status(200).send({
            user,
            token
        })
    } catch (e) {

        res.status(400).send(serializeError(e).message)
    }
})

userRouter.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token != req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }

})

userRouter.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }

})



userRouter.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar=buffer
   
    await req.user.save()
    res.send('succesful updated')
}, (error, req, res, next) => {
    res.send({
        error: error.message
    })
})

userRouter.delete('/user/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send('succesful updated')
}, (error, req, res, next) => {
    res.send({
        error: error.message
    })
})

userRouter.get('/users/:id/avatar',async(req,res)=>{
try{
const user=await User.findById(req.params.id)

if(!user||!user.avatar)
throw new Error()

res.set('Content-Type','image/png')
res.send(user.avatar)
}
catch(e){
    res.status(404).send()
}


})

module.exports = userRouter