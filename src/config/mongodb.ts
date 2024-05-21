import { mongo_uri } from "../helpers/constants"

const mongoose = require('mongoose')

const connectToMongoDB = async() => {
    try {
        await mongoose.connect(mongo_uri, {})
        console.log(`MongoDB connected successfully`.yellow.bold)
    } catch (err) {
        console.log(err)
    }
}

export default connectToMongoDB