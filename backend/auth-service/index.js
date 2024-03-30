

//mongodb+srv://pavanpnaik321:<password>@cluster0.v1mx7az.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// mongodb+srv://pavanpnaik321:<password>@cluster0.v1mx7az.mongodb.net/

const express = require('express');
const app = express();
const PORT = process.env.PORT || 7070;
const mongoose = require('mongoose');
const User = require('./User')
const jwt = require('jsonwebtoken')


const uri = 'mongodb+srv://pavanpnaik321:Pavan21p@cluster0.v1mx7az.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
app.use(express.json());

const connectToDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to Mongodb Atlas');
    } catch (error) {
        console.error(error);
    }
};

connectToDB();

// Register
app.post('/auth/register',async(req,res)=>{
    const {email,password,name} = req.body;
    const userExist = await User.findOne({email});
    if(userExist){
        return res.json({message:"User already Exist"})
    }else{
        const newUser = new User({
            name,
            email,
            password
        })
            newUser.save();
            return res.json(newUser)
    }
})
// Login
app.post("/auth/login",async (req,res)=>{
    const {email,password} = req.body;

    const user = await User.findOne({email})

    if(!user){
        return res.json({message: "User dosent exist"})
    }else{
        // check password
        if(password !== user.password){
            return res.json({message: 'Password is incorrect'})
        }
        const payload = {
            email,
            name:user.name
        }
        jwt.sign(payload,"secret",(err,token)=>{
            if(err){
                console.log(err)
            }else{
                return res.json({token:token})
            }
        })
    }
})

app.listen(PORT, () => {
    console.log(`Auth-service at ${PORT}`);
});
