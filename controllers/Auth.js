const OTP = require("../models/OTP");
const User = require("../models/User");
const Profile = require("../models/Profile");
const OtpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();


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

//login 
exports.login = async (req,res) => {
    try{
        //fetching the data
        const {email , password} = req.body();
        //validating the data
        if(!email || !password) {
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            })
        }
        //check if user not exists
        const user = await User.find({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"user is not registered, Please sign up",
            })
        }
        //password matching -> generating JWT 
        if(await bcrypt.compare(password,user.password)){
            const payload = {
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload,process.env.JWT_SECRET , {
                expiresIn:"2h",
            })
            user.token = token;
            user.password = undefined;
            //create the cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token, 
                user,
                message:"Logged in succefully",
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"password is incorrect",
            })
        }
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"login failuer , Please try again",
        })
    }
    
}

//change password
exports.changePassword = async (req, res) => {
    try {
        
      const userId = req.user.id;
      // find the user with the id present in req.body
      const user = await User.findById({ _id: userId });
      // get updated details from req.body
      const { oldPassword, newPassword, confirmNewPassword } = req.body;
      if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: "Please provide all fields.",
        });
      }
  
      // check weather the old pass and pass present in the db are same using bcrypt
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" });
      }
      // validate both new and confirm pass
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: "The new password and confirm password do not match.",
        });
      }
      // hash the new password using bcrypt
      const encryptedPassword = await bcrypt.hash(newPassword, 10);
      // update the user's password
      const updatedUser = await User.findByIdAndUpdate(
        { _id: userId },
        {
          //! ------------------- there may be an issue with this -------------------
          $set: { password: encryptedPassword },
        },
        { new: true }
      );
      // console.log("before mail is sent");
      try {
        const emailResponse = await mailSender(
          updatedUser.email,
          "this is header",
          passwordUpdated(
            updatedUser.email,
            "Password Updated Successfully",
            `${updatedUser.firstName} ${updatedUser.lastName}`
          )
        );
        console.log("Email sent successfully: ", emailResponse.response);
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error);
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
      // console.error("Error occurred while updating password:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
      });
    }
  };
