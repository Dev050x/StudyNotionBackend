const User = require("../models/User");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");

//reset password
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