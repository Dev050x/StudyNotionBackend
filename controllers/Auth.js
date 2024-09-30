const OTP = require("../models/OTP");
const User = require("../models/User");
const Profile = require("../models/Profile");
const OtpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");


//send otp(generate the otp and saving into the database)
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
        return res.status(200).json({
            success:true,
            message:"otp sent succefully",
            otp,
        })
        
    }
    catch(error){
        console.log("there is some error in sending otp",error);
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}

//sign-up
exports.signUp = async (req,res) => {
    try{
        //fetch the data from the request
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body();
        //validate the user
        if(!email || !password || !firstName || !lastName || !confirmPassword || !otp ){
            res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }

        //password math
        if(password != confirmPassword) {
            res.status(400).json({
                success:false,
                message:"password and confirm password should be same",
            })
        }
        //checking the user if already exists
        let existingUser = await User.findOne({email});
        if(existingUser){
            res.status(400).json({
                success:false,
                message:"user already exists",
            })
        }
        //finding the recent otp
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);  
        console.log(recentOtp);
        //validate the otp
        if(recentOtp.length == 0){
            res.status(400).json({
                success:false,
                message:"please enter otp properly",
            })
        }else if(recentOtp !== otp){
            res.status(400).json({
                success:false,
                message:"please enter otp correctly",
            })
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password,10);
        //create the entry in DB
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })
        //response send
        return res.status(200).json({
            success:true,
            message:"user registered succefully",
            user,
        })

    }
    catch(error){   
        return res.status(500).json({
            success:false,
            messsage:"user cannot be registered please try again",
        })

    }

}