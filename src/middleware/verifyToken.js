import jwt from "jsonwebtoken";
import 'dotenv/config';

export const verifyToken= async (req,res,next)=>{
    const token=req.header('Authorization')?.split(" ")[1];
    if(!token){
        return res.status(401).send({
            message:"Access denied: No Token Provided"
        })
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_ACCESSTOKEN_SECRET);
        req.user=decoded;
        next();
    } catch (error) {
        console.error(error);
        return res.status(403).send({
            message:"Invalid Authentication Token"
        })
    }
}