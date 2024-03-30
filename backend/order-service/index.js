const express = require('express');
const app = express();
const PORT = process.env.PORT || 9090;
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
client.connect().then(console.log("Connected to database of order service")).catch(err => console.error(err));

async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER")
}

connect().then(()=>{
        channel.consume("ORDER",async(data)=>{
            console.log("Consuming ORDER queue");
            const {products , userEmail} = JSON.parse(data.content)
           const neworder = await store_data(products,userEmail)
           channel.ack(data)
           console.log(neworder)
        //    you cannot send responce form someother queue so we send data back to product
        channel.sendToQueue("PRODUCT",Buffer.from(JSON.stringify({neworder})))
        })
})

const store_data = async (products,userEmail)=>{
    try {
        let total =0;
        const product_ids = []
        products.forEach((product)=>total+=parseInt(product.price))
        products.forEach((product)=>product_ids.push(product._id));
        
        const {rows} = await client.query(`INSERT INTO orders (  product_id , total_price , user_email ) VALUES ($1,$2,$3) RETURNING *`,[product_ids,total,userEmail])
        const orderId = rows[0];
        return orderId
    } catch (error) {
        return error;
    }
    }
app.listen(PORT, () => {
    console.log(`Order-service at ${PORT}`);
});
