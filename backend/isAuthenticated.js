const jwt = require('jsonwebtoken')

// before buying any product it will check the token
const isAuthenticated = async(req,res,next)=>{
    // "Bearer <token>"
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token,"secret",(err,user)=>{
        if(err){
            return res.json({message:err})
        }else{
            res.user = user;
            next();
        }
    })
}

module.exports = isAuthenticated