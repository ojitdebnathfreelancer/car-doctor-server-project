const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send('car doctor server running')
});

const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASSWORD}@cluster0.r7d25w3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyToken = (req, res, next) => {
    const pToken = req.headers.authorization;
    if (!pToken) {
        return res.status(401).send({ message: "unauthorized access", success:false })
    }
    const mToken = pToken.split(' ')[1];
    jwt.verify(mToken, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(401).send({ message: "unauthorized access", success:false })
        };
        req.decoded = decoded;
        next();
    });
};
// token verify funtion 

async function car() {
    try {
        // console.log('db running')

        const servicesData = client.db('services').collection('data');
        const orderData = client.db("services").collection("order");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1d" });
            res.send({ token });
        });
        // sent token and get user info for verify 

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesData.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const order = await servicesData.findOne(query);
            res.send(order);
        });

        app.post('/checkout', async (req, res) => {
            const order = req.body;
            const result = await orderData.insertOne(order);
            res.send(result);
        });

        app.get('/orders', verifyToken, async (req, res) => {

            const decoded = req.decoded;

            if (decoded.email === req.query.email) {

                let query = {};

                if (req.query.email) {
                    query = {
                        email: req.query.email
                    }
                };

                const cursor = orderData.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }

            else if(decoded.emil !== req.query.emil){
                return res.status(403).send({message: "Your access not valid", succces:false})
            }

        });

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            const query = { _id: ObjectId(id) };
            const updated = {
                $set: {
                    status: status.status
                }
            };
            const restult = await orderData.updateOne(query, updated);
            res.send(restult);
        });

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderData.deleteOne(query);
            res.send(result);
        });

        app.delete('/alldelete', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const restult = await orderData.deleteMany(query);
            res.send(restult);
        });

    }
    catch (error) {
        res.send(
            {
                succces: false,
                message: "Try again for post"
            }
        );
    }
}

car().catch(error => console.error(error));



app.listen(port, () => {
    console.log('Running', port);
})
