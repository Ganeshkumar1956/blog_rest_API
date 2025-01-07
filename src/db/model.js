import { Schema,model,ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';

const BlogSchema=new Schema({
    title:{type:String,required:[true,"Title is Required"]},
    thumbnail:{type:String},
    author:{
        type: ObjectId,
        ref:"users"
    },
    body:{type:String,required:[true,"Thumbnail is Required"]},
    category:{
        type:[String],
        required:[true,"Category is Required"]
    },
    date:{type:Date,default:Date.now},
    likes:{type:Number,default:0},
    likedBy:[{type:ObjectId,ref:"users"}],
    comments:[{
        body:{type:String,required:"Comment Can't be blank"},
        date:{type:Date,default:Date.now},
        author:{
            type:ObjectId,
            ref:"users"
        }
    }],
    TimeToRead:Number
})
BlogSchema.methods.countTime=function(){
    this.TimeToRead=Math.ceil(this.body.replace(/\n/g, " ").split(/\s+/).length/200);
}
BlogSchema.methods.like=function(userId){
    this.likes+=1
}
BlogSchema.methods.unlike=function(){
    if(this.likes>=1){
        this.likes-=1
    }
}

const UserSchema=new Schema({
    profileImg:String,
    firstname:{
        type:String,
        required:[true,"firstname is Required"],
        match:[/^[A-Za-z ]+$/, "Firstname must contain only alphabets and spaces"],
    },
    lastname:{
        type:String,
        required:[true,"lastname is Required"],
        match:[/^[A-Za-z\s]+$/,"lastname must contain only alphabets and spaces"]
    },
    email:{
        type: String,
        lowercase: true,
        index:true,
        required: [true, "email can't be blank"],
        unique:true,
        match: [/\S+@\S+\.\S+/, 'email is invalid']
    },
    hash:{type:String,required:[true,"Password is Required"]}
    //salt:String use when using pbkdf2
})

/*
To Use pbkdf2:

Import below code:
import {randomBytes,pbkdf2Sync} from 'crypto';

To Encrypt:
this.salt = randomBytes(16).toString('hex');
this.hash = pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');

To Validate:
var hash = pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
return this.hash === hash;

*/
UserSchema.methods.setPassword = async function (password) {
    const saltRounds = 10;
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        this.hash = hash;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw error;
    }
};  

UserSchema.methods.validPassword = function(password) {
    bcrypt.compare(password,this.hash,(err,res)=>{
        if(res){
            return true;
        }else{
            return false;
        }
    })
};

const userTokenSchema= new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"users",
        required:true
    },
    refreshtoken:{
        type:String,
        required:true
    }
}) 


const BlogModel=new model("blogs",BlogSchema);
const UserModel=new model("users",UserSchema);
const UserToken=new model("jwttokens",userTokenSchema);

export {BlogModel,UserModel,UserToken};
