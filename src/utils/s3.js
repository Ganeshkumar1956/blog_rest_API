import AWS from 'aws-sdk';
import 'dotenv/config';

export const uploadToS3=(file,bucketName,folder="")=>{
    try {
        AWS.config.update({region:process.env.AWS_REGION});
        const s3=new AWS.S3({
            credentials:{
                accessKeyId:process.env.AWS_ACCESS_KEY,
                secretAccessKey:process.env.AWS_SECRET_KEY,
            }
        });

        const fileName=`${folder? folder+"/":""}img_${(Date.now()).toString()}.${file.mimetype.split("/")[1]}`;

        const param={
            Bucket:bucketName,
            Key:fileName,
            Body:file.data
        };

        return new Promise((resolve,reject)=>{
            s3.upload(param,{},(err,data)=>{
                if(err){
                    console.log(err);
                    reject(err);
                }else{
                    resolve(data);
                }
            })
        });
    } catch (error) {
        return error;
    }
}

export const getSlug=(title)=>{
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
}