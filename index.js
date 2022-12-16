require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const mongoose = require('mongoose')
const Person = require('./models/person')

app.use(express.json())
app.use(express.static('build'))
morgan.token('data', (req) => {
    if (req.method === 'POST') {
        return JSON.stringify(req.body)
    } else {
        return ''
    }
})
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        tokens.data(req, res)
    ].join(' ')
}))

const url = process.env.MONGODB_URI

mongoose.connect(url)

app.get('/info', (request, response, next) => {
    Person.countDocuments()
        .then(counter => {
            response.send(`Phonebook has info for ${counter} people<br/>${new Date()}`)
        })
        .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(data => {
            response.json(data)
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!(body.name && body.number)) {
        return response.status(400).json({
            error: 'name or (and) number are missing'
        })
    } else {
        Person.countDocuments({ name: body.name })
            .then(counter => {
                if (counter) {
                    return response.status(400).json({
                        error: 'person already in the Phonebook'
                    })
                } else {
                    const person = new Person({
                        name: body.name,
                        number: body.number
                    })

                    person.save()
                        .then(savedPerson => {
                            response.json(savedPerson)
                        })
                        .catch(error => next(error))
                }
            })
    }
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.find({ _id: request.params.id })
        .then(person => {
            response.json(person)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body
    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).send({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})