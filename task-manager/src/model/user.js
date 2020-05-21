const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')
const userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{

        token: {
            required: true,
            type: String
        }

    }],
    avatar:{
        type:Buffer
    }
}, {
    timestamps: true
})

userschema.virtual('mytasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'

})




userschema.methods.generateauthtoken = async function () {

    const user = this
    const token = await jwt.sign({
        id: user._id.toString()
    }, "!@#$%^&*()_+")
    user.tokens = user.tokens.concat({
        token
    })
    await user.save()
    return token
}
userschema.methods.getpp = async function () {

    const user = this
    userobject = user.toObject()
    delete userobject.password
    delete userobject.tokens
    return userobject
}







userschema.statics.login = async (email, password) => {
    const user = await User.findOne({
        email
    })

    if (!user)
        throw new Error('Email not found')

    const ismatch = await bcryptjs.compare(password, user.password)

    if (!ismatch)
        throw new Error("wrong password")

    return user
}



userschema.pre('save', async function () {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcryptjs.hash(user.password, 8)
    }
})
userschema.pre('remove', async function () {
    const user = this

    await Task.deleteMany({
        owner: user._id
    })
})

const User = mongoose.model('User', userschema)


module.exports = User