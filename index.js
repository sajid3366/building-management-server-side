const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middlewares
app.use(express.json());
app.use(cors());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l9mlnno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('homeDB').collection('users');



    // for user 
    app.get('/users', async(req, res) =>{
        const user = req.body;
        const result = await userCollection.find().toArray()
        res.send(result)
    })
    app.post('/users', async(req, res) =>{
        const user = req.body;
        const result = await userCollection.insertOne(user)
        res.send(result);
    })
    











    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', async (req, res) => {
    res.send('smart build is running');
})
// app.all('*', async (req, res, next) => {
//     const error = new Error(`invalid path ${req.originalUrl}`)
//     error.status == 404
//     next(error)
// })
// app.use((err, req, res, next) => {
//     res.status(err.status || 500).json({
//         message: err.message,
//         errors: err.errors,
//     });
// })

app.listen(port, () => {
    console.log(`Smart build server is running on port ${port}`);
});