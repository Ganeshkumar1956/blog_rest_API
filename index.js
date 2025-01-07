import express from 'express';
import "dotenv/config";
import connectDb from "./src/db/dbconfig.js";
import fileUpload from 'express-fileupload';
import UserRoute from './src/routes/UserRoute.js';
import BlogRoute from './src/routes/BlogRoute.js';

//Configurations
const app=express();
app.use(express.static('public'));
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({extended:true}));

//Routes
app.use("/users",UserRoute);
app.use("/blogs",BlogRoute);

app.listen(process.env.PORT,async ()=>{
    await connectDb();
    console.log("Server is listening on Port",process.env.PORT);
});