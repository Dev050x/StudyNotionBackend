const User = require("../models/User");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");
const bcyrpt = require("bcrypt");

//reset password token (generate the token and send the url into the mail)
exports.resetPasswordToken = async (req,res) => {
    try{
        //fetch the mail
        const email = req.body.email;
        //validating the mail
        const userExists = await User.findOne({email:email});
        if(!userExists){
            return res.status(401).json({
                success:false,
                message:"user does not exists in our database",
            })
        }
        //generate token
        const token = crypto.randomUUID();
        //updating details in User Database
        const userDetails = await User.findOneAndUpdate({email:email},{
            token:token,
            resetPasswordExpiresIn: Date.now() + 5*60*1000,
        },{new:true});
        //making the url
        const url = `http://localhost:3000/${token}`;
        //sending the mail
        await mailSender(email , "Reset Password request" , `reset password link ${url}`);
        //returning the response
        return res.status(200).json({
            success:true,
            message:"reset mail sent succefully",
        })

    }
    catch(error){
        return res.status(401).json({
            success:false,
            messsage:"there is some error while sending reset-password mail",
        })
    }
}

//reset password (changing the mail)
const resetPassword = async (req,res) => {  
    try{
        //fetching the mail
        const {password , confirmPassword , token} = req.body();
        //validation
        if(password !== confirmPassword){
            res.status(401).json({
                success:false,
                message:"password and confirm password mismatched",
            })
        }
        //finding the user details using token
        const userDetails = await User.findOne({token:token});
        if(!userDetails){
            return res.status(401).json({
                success:false,
                messsage:"there is no such user in database",
            })
        }
        //token time cheking
        if(userDetails.resetPasswordExpiresIn < Date.now()){
            return res.status(403).json({
                success:false,
                message:"token expired",
            })
        }
        //hash pwd
        const hashedPassword = await bcyrpt.hash(password,10);
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );
        //return response
        return res.status(200).json({
            success:true,
            message:"password reset succefully",
        });
    }
    catch(error){
        return res.status(403).json({
            success:false,
            message:"reset password failed",
        })
    }
}