const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type: Date,
        default:Date.now(),
        expires:5*60,
    }

});

async function sendVerificationMail(email , otp) {
    try{
        const mailResponse = await mailSender(email,"Verification mail is sent by Study Notion", otp);
        console.log("Email Sent Succefullye" , mailResponse);
    }
    catch(error){
        console.log("error occured while sending the mail",error);
        throw error;
    }
}


OTPSchema.pre("save" , async function (next) {
    await sendVerificationMail(this.email,this.otp);
    next();
})


module.exports = mongoose.model("OTP",OTPSchema);
