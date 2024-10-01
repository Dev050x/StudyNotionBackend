const jwt = require("jsonwebtoken");
require("dotenv").config();
con
 


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
            const decode =jwt.verify(token , process.env.JWT_SECRET);    
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
    next();
}

//isStudent
exports.isStudent = async (req,res,next) => {
    try{
        //cheking the user
        if(req.user.accountType !== "Student"){
            res.status(401).json({
                success:false,
                message:"this is protected route for student only",
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified, please try again",
        })
    }
}

//isInstructor
exports.isInstructor = async (req,res,next) => {
    try{
        //cheking the user
        if(req.user.accountType !== "Instructor"){
            res.status(401).json({
                success:false,
                message:"this is protected route for Instructor only",
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified, please try again",
        })
    }
}

//isAdmin
exports.isAdmin = async (req,res,next) => {
    try{
        //cheking the user
        if(req.user.accountType !== "Admin"){
            res.status(401).json({
                success:false,
                message:"this is protected route for Adming only",
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified, please try again",
        })
    }
}