const Course = require("../models/Course");
const Tags = require("../models/Tags");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
require("donenv").config();

//create-course handler
exports.createCourse = async (req,res) => {
    try{
        //fetch the data
        const {courseName , courseDescription , whatWillYouLearn , price , tag} = req.body();
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;
        //validation
        if(!courseName || !courseDescription || !whatWillYouLearn || !price || !tag || !thumbnail){
            return res.status(400).json({
                success:false,
                message:"all fields are required",
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details", instructorDetails);

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:"instructor details not found",
            })
        }

        //check given tag is valid or not
        const tagDetails = await Tags.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:"tag details not found",
            })
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail , process.env.FOLDER_NAME);

        //create an entry in database
        const newCourse =  await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            tag:tagDetails._id,
            thumbnail:thumbnailImage.secure_url,
        })

        //add the new courser in instructor user schema
        await User.findById({_id: instructorDetails._id} , {
            $push: {
                courses:newCourse._id,
            }
        },
            {new:true},
        );
        //add entry in tag schema
        await Tags.findById({
            _id:tag
        }, {
            $push: {
                course:newCourse._id,
            }
        }, {new:true});

        return res.status(200).json({
            success:true,
            message:"course upload succefully",
            data:newCourse
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"failed to upload course",
            error:error.message,
        })
    }
}