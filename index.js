const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const router = require('./routes')
const errorMiddleware = require('./middleware/error-middleware')
require('dotenv').config()

const PORT = process.env.PORT || 5000
const app = express()

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
)
app.use(express.json())
app.use(cookieParser())
app.use('/api', router)
app.use(errorMiddleware)
;(async () => {
  try {
    const mongoUri = process.env.MONGO_URI
    await mongoose.connect(mongoUri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    console.log(`Connected to mongo: ${mongoUri}`)

    app.listen(PORT, () => {
      console.log(`Server started at ${PORT} port`)
    })
  } catch (e) {
    console.log(e)
  }
})()
