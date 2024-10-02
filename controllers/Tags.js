const Tags = require("../models/Tags");



//create tag handler function
exports.createTag  = async (req,res) => {
    try{
        //fetch the data
        const {name, description} = req.body();
        //validate 
        if(!name || description){
            return res.status(400).json({
                success:false,
                message:"name and description both required"
            })
        }
        //create entry in DB
        const tagDetails = await Tags.create({
            name:name,
            description:description,
        })
        console.log(tagDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"tag created succefully",
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }   
}

//show all tags
exports.showAlltags = async (req,res) => {
    try{
        const allTags = await Tags.find({} , {
            name:true,
            description:true,
        });
        res.status(200).json({
            success:true,
            message:"all tags returned succefully",
            allTags,
        })

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"cannot able to find all tags"
        })
    }
}