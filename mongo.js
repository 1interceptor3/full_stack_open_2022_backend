const mongoose = require('mongoose')

if (process.argv.length < 3) {
    console.log('Please provide the password as an argument: node mongo.js <password>')
    process.exit(1)
}


const password = process.argv[2]
const name = process.argv[3]
const number = process.argv[4]

const url = `mongodb+srv://volkov:${password}@cluster0.u2hqvwe.mongodb.net/phonebookApp?retryWrites=true&w=majority`

const personSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Person = mongoose.model('Person', personSchema)

mongoose
    .connect(url)
    .then(() => {
        if (name && number) {
            const person = new Person({
                name, number
            })
            person.save()
                .then(result => {
                    console.log(`added ${result.name} number ${result.number} to phonebook`)
                    mongoose.connection.close()
                })
        } else {
            Person.find({})
                .then(result => {
                    console.log('phonebook:')
                    result.map(person => {
                        console.log(`${person.name} ${person.number}`)
                    })
                    mongoose.connection.close()
                })
        }
    })
    .catch((err) => console.log(err))