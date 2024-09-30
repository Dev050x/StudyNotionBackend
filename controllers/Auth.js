const OTP = require("../models/OTP");
const User = require("../models/User");
const OtpGenerator = require("otp-generator");


//send otp
exports.sendOTP = async (req,res) => {
    try{
        //fetching the mail
        const {email} = req.body();
        
        //check if user already exists
        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success:'false',
                message:"user already exists"
            })
        }
        //generating otp
        var otp = OtpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        //untill finding the unique otp
        let result = await OTP.findOne({otp:otp});
        while(result){
            otp = OtpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp:otp});
        }
        //generate otp for the database
        let payLoad = {email,otp};
        let otpBody = await OTP.create(payLoad);
        console.log(otpBody);

        //return the responce status
        res.status(200).json({
            success:true,
            message:"otp sent succefully",
            otp,
        })
        
    }
    catch(error){
        console.log("there is some error in sending otp",error);
        res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}