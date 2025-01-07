import jwt from 'jsonwebtoken';
import {UserToken} from '../db/model.js'
import 'dotenv/config'

export const generateToken= async (userid)=>{
    try {
        const accesstoken= jwt.sign(
            {userId:userid},
            process.env.JWT_ACCESSTOKEN_SECRET,
            {expiresIn:"15m"}
        );
        const refreshtoken= jwt.sign(
            {userId:userid},
            process.env.JWT_REFRESHTOKEN_SECRET,
            {expiresIn:"1d"}
        );
        await UserToken.findOneAndUpdate(
            {userId:userid},
            {refreshtoken:refreshtoken},{upsert:true}
        );
        return Promise.resolve({accesstoken,refreshtoken});
    } catch (error) {
        console.error(error);
        return error;
    }
}

export const refreshtoken=async (req,res)=>{
    const token=req.cookies.refreshtoken;
    try {
        if(!token){
            res.status(403).send({
                message:"Refresh token required"
            })
        }
        const user=await UserToken.findOne({refreshtoken:token});
        if(!user){
            return res.status(400).send("Invalid refresh token");
        }
        const payload=jwt.verify(user.refreshtoken,process.env.JWT_REFRESHTOKEN_SECRET);
        const {accesstoken,refreshtoken}=generateToken(payload.userId);
        user.refreshtoken=refreshtoken;
        await user.save();
        res.cookie("refreshtoken",refreshtoken,{
            httpOnly:true,
            secure:true,
            path:'/users/refreshtoken',
        })
        return res.status(201).send({
            accesstoken:accesstoken
        });
    } catch (error) {
        res.status(500).send({
            message:"Internal Server Error"
        })
    }
}