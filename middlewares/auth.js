const jwt = require("jsonwebtoken");
require("dotenv").config();


//auth
exports.auth = async (req,res,next) => {
    try{
        //extract token
        const token = req.cookies.token || req.body.token || req.header("Authorisation").replace("Bearer " , "");

        //if token not found
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            });
        }

        //verify token
        try{
            const decode = await jwt.verify(token , process.env.JWT_SECRET);    
            console.log(decode);
            req.user = decode;
        }
        catch(error){   
            return res.status(401).json({
                success:false,
                message:"Token is invalid",
            });

        }
    }
    catch(error){
        return res.status(401).json({
            success:false,
            message:"something went wrong while authenticating token",
        });
    }
}