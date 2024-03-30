const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const amqp = require('amqplib');
const isAuthenticated = require('../isAuthenticated')

app.use(express.json());

var channel, connection;

const client = new Client({
    host: "localhost",
    port: 5433, // Corrected port number
    user: "postgres",
    password: "postgres",
    database: "pavannaik"
});
client.connect().then(console.log("Connected to database of product service")).catch(err => console.error(err));

// connect to rabbitmq
async function connect() {
    const amqpServer = "amqp://localhost:5672"; // Corrected server URL
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}

connect();

// client.query("CREATE TABLE IF NOT EXISTS product ( name varchar(255) PRIMARY KEY, description VARCHAR(255), price DECIMAL(10, 2), created_at DATE);", 
//     (err, res) => {
//     console.log(err, res);
//     client.end();
// });

// create a new product
app.post('/product/create', isAuthenticated, (req, res) => {
    const { name, description, price } = req.body;

    client.query('INSERT INTO product (name, description, price, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [name, description, price],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to create product" });
            }
            const insertedProduct = result.rows[0];
            console.log("Product inserted successfully:", insertedProduct);
            return res.status(201).json({ message: "Product created successfully", product: insertedProduct });
        }
    );
});

// User sends a list of product's ID's to buy

// Creating an order with those products and a total value of sum of product's prices
app.post('/product/buy', isAuthenticated, async(req, res) => {
    const { ids } = req.body;
    var order;
    // Construct the query dynamically based on the number of product IDs
    const placeholders = ids.map((id, index) => `$${index + 1}`).join(',');
    const query = `SELECT * FROM product WHERE _id IN (${placeholders})`;

         client.query(query, ids, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to fetch products" });
        }
        const products = result.rows;
        channel.sendToQueue("ORDER",Buffer.from(JSON.stringify({
            products,
            userEmail: res.user.email,
        })))
        channel.consume("PRODUCT",async(data)=>{
            console.log("Consuming PRODUCT queue")
            order = await JSON.parse(data.content);
            channel.ack(data);
            
            return res.json(order)
        })
        // return res.status(200).json({ products });
    });
    

});




app.listen(PORT, () => {
    console.log(`Product-service at ${PORT}`);
});
