const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    const apartmentCollection = client.db('homeDB').collection('apartments');
    const agreementCollection = client.db('homeDB').collection('agreements');
    const announcementCollection = client.db('homeDB').collection('announcements');
    const paymentCollection = client.db('homeDB').collection('payments');


    // jwt related api 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })


    // for user 
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result);
    })
    app.patch('/users/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: 'member'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)

    })
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin })
    })
    app.get('/users/member/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      let member = false;
      if (user) {
        member = user?.role === 'member';
      }
      res.send({ member })
    })
    app.get('/users/:role', async (req, res) => {
      const member = 'member';
      // const role = req.params.role;
      const query = { role: member }
      const result = await userCollection.find(query).toArray();
      res.send(result)

    })
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: ''
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })


    // apartment management
    app.get('/apartments', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const apartment = await apartmentCollection.find().skip(page * size).limit(size).toArray();
      res.send(apartment)
    })


    // for pagination count
    app.get('/countApartment', async (req, res) => {
      const count = await apartmentCollection.estimatedDocumentCount();
      res.send({ count });
    })

    // agreement related api
    app.get('/agreement/:status', async (req, res) => {
      const status = 'pending';
      const query = { status: status }
      const agreement = await agreementCollection.find(query).toArray();
      res.send(agreement);
    })
    app.post('/agreement', async (req, res) => {
      const agreement = req.body;
      // console.log('agreement', agreement);
      const result = await agreementCollection.insertOne(agreement);
      res.send(result)
    });
    app.get('/agreement/member/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email };
      const result = await agreementCollection.find(query).toArray();
      res.send(result)
    })

    app.patch('/agreement/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: 'checked'
        },
      };
      const result = await agreementCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    app.patch('/agreement/:id', async (req, res) => {
      const id = req.params.id;
      const date = req.body.month;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          month: date
        },
      };
      const result = await agreementCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })

    // payment intent

    app.post("/create-payment-intent", async (req, res) => {
      const { payment } = req.body;
      const amount = parseInt(payment * 100)
      // console.log(amount);
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get('/payments/:email', async (req, res) => {
      const query = { email: req.params.email }
      const result = await paymentCollection.find(query).toArray();
      res.send(result)
    })
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send(paymentResult);
    })

    // announcement realted api
    app.post('/announcement', async (req, res) => {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement);
      res.send(result)
    })
    app.get('/announcement', async (req, res) => {
      const result = await announcementCollection.find().toArray()
      res.send(result)
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