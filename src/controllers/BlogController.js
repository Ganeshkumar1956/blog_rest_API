import { BlogModel } from "../db/model.js";
import { uploadToS3 } from "../utils/s3.js";
import { getSlug } from "../utils/s3.js";

export const createBlog=async(req,res)=>{
    try {
        const { title, body, TimeToRead } = req.body;
        const category=JSON.parse(req.body.category);
        const thumbnail="";
        const authorId = req.user.userId;
        const newBlog = new BlogModel({
            title, 
            thumbnail,
            body, 
            category, 
            TimeToRead,
            author: authorId 
        });
        await newBlog.validate();
        if(!req.res || !req.files.thumbnail){
            res.send({
                message:"Thumbnali is required"
            })
        }
        newBlog.countTime();
        const result=await uploadToS3(req.files.thumbnail,process.env.AWS_BUCKET,'thumbnail');
        newBlog.thumbnail=result.Key;
        await newBlog.save();

        return res.status(201).send({
            message:"Blog Created Succesfully"
        })
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(409).send({
                message: `Duplicate value for ${duplicateField}`,
                field: duplicateField,
                value: error.keyValue[duplicateField],
            });
        }
        if (error.name === "ValidationError") {
            // Handle schema validation errors
            return res.status(400).send({
                message: "Validation Error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }
        // Handle all other errors
        console.error(error.message);
        return res.status(500).send({
            message: "Fail to create Blog",
            error: "An unexpected error occurred",
        });
    }
}

export const getAllBlog=async(req,res)=>{
    try {
        const blogs=await BlogModel.find({},'title category date TimeToRead');
        return res.send(blogs);
    } catch (error) {
        console.error("Error: "+error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const getBlogById=async(req,res)=>{
    const url=req.params.blog.split("-");
    const blogId=url.pop();
    try {
        const blog=await BlogModel.findOne({_id:blogId}).populate('author','_id, firstname profileImg');
        if(!blog){
            return res.status(404).send({
                message:"Blog Not Found, Check the URL"
            })
        }
        const slug=getSlug(blog.title)
        if(slug!=url.join("-")){
            return res.status(404).send({
                message:"There is a mismatch in the URL",
                url:getSlug(blog.title)+"-"+blogId
            })
        }
        return res.send(blog);
    } catch (error) {
        if(error.name=="CastError"){
            return res.status(404).send({
                message:"Blog Not Found! Check the URL"
            })
        }
        console.error("Error: "+error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const getBlogByCategory=async(req,res)=>{
    try {
        const blogs=await BlogModel.find({category:{$in:req.params.category}},'title category date TimeToRead');
        return res.send(blogs);
    } catch (error) {
        console.error("Error: "+error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const likeBlog=async(req,res)=>{
    try {
        const result = await BlogModel.findOneAndUpdate(
            { _id: req.params.blog, likedBy: { $ne: req.user.userId } }, // Check if userId is not already present
            { $push: { likedBy: req.user.userId } }, // Add userId to the array
            { new: true } // Return the updated document
        );

        if (!result) {
            return res.send({ message: "User has already liked this Blog or Blog does not exist." });
        }
        result.like();
        result.save();
        return res.send({ message: "User added to likes successfully."});
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const unlikeBlog=async(req,res)=>{
    try {
        const result = await BlogModel.findOneAndUpdate(
            { _id: req.params.blog, likedBy: { $eq: req.user.userId } }, // Check if userId is not already present
            { $poll: { likedBy: req.user.userId } }, // Add userId to the array
            { new: true } // Return the updated document
        );

        if (!result) {
            return res.send({ message: "User Not liked this Blog Before or Blog does not exist." });
        }
        result.unlike();
        result.save();
        return res.send({ message: "User Unliked the Blog"});
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const addComment = async (req, res) => {
    const { blogId } = req.params; // blog ID from URL
    const { body } = req.body; // Comment body and user ID from request body

    if (!body) {
        return res.status(400).send({ message: "Comment body is required." });
    }

    try {
        const blog = await BlogModel.findById(blogId);
        if (!blog) {
            return res.status(404).send({ message: "Blog not found." });
        }

        const newComment = {
            body,
            user: req.user.userId,
        };

        blog.comments.push(newComment);
        await blog.save();

        return res.status(201).send({
            message: "Comment added successfully.",
            comments: blog.comments,
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).send({ message: "Failed to add comment." });
    }
};