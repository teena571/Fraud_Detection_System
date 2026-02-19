import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudshield'
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }

    const conn = await mongoose.connect(mongoURI, options)

    console.log(`✅ MongoDB connected: ${conn.connection.host}`)

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close()
        console.log('✅ MongoDB connection closed through app termination')
        process.exit(0)
      } catch (err) {
        console.error('❌ Error during MongoDB shutdown:', err)
        process.exit(1)
      }
    })

    return conn
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('\n💡 Possible solutions:')
    console.error('   1. Whitelist your IP in MongoDB Atlas')
    console.error('   2. Check your internet connection')
    console.error('   3. Verify MONGODB_URI in .env file')
    console.error('\n📖 Guide: https://www.mongodb.com/docs/atlas/security-whitelist/\n')
    process.exit(1)
  }
}

export default connectDB