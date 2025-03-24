import {UserModel, UserToken} from '../db/model.js';
import { uploadToS3 } from '../utils/s3.js';
import { compare } from 'bcrypt';
import { generateToken } from './AuthController.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const profileImgUpload=async (profilePic)=>{
    try {
        const result=await uploadToS3(profilePic,process.env.AWS_BUCKET,'profile')
        return result.Key;
    } catch (error) {
        console.log(error);
    }
}

export const register=async (req,res)=>{
    try {
        const data =req.body;
        const user=new UserModel({
            firstname:data.firstname,
            lastname:data.lastname,
            email:data.email,
        });
        if(data.email){
            const existingMail=await UserModel.findOne({
                email:data.email
            })
            if(existingMail){
                return res.status(400).send({
                    message:"ValidationError",
                    error:"Email is already exists, use another Email"
                })
            }
        }
        if(data.password){
            await user.setPassword(data.password);
        }
        await user.validate();  
        await user.save();
        return res.status(201).send({
            message: "User Registered Successfully",
        });
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
            message: "Fail to create user",
            error: "An unexpected error occurred",
        });
    }
}

export const login=async (req,res)=>{
    try {
        const data=req.body;
        if(!data.email || !data.password){
            res.status(400).send({
                message:"Email and password Required"
            });
        }
        const user=await UserModel.findOne({
            email:data.email
        })
        if(!user){
            return res.status(401).send({
                message:"Invalid Email or Password"
            });
        }
        const verifyPassword=await compare(data.password,user.hash);
        if(!verifyPassword){
            return res.status(401).send({
                message:"Invalid Email or Password"
            });
        }
        const {accesstoken,refreshtoken}=await generateToken(user._id);
        res.cookie("refreshtoken",refreshtoken,{
            httpOnly:true,
            secure:true,
            path:'/users/refreshtoken',
        })
        return res.status(200).send({
            accesstoken:accesstoken,
            message:"User Logged In Successfully"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}

export const logout=async(req,res)=>{
    try {
        const result=await UserToken.deleteMany({userId:req.user.userId});
        if(result.deletedCount==0){
            return res.status(200).send({
                message:"User Already Logged Out"
            });
        }
        res.clearCookie('refreshToken', { httpOnly: true });
        return res.status(200).send({
            message:"User Logged Out Successfully"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message:"Internal Server Error"
        })
    }
}