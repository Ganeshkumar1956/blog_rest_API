import {mongoose} from 'mongoose';
import {config} from "dotenv";
config();
const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.DBURI);
        console.log("MongoDB connected Successfully");
    }catch(err){
        console.error("connection to Mongodb has Failed!",err);
        process.exit();
    }
}

export default connectDb;