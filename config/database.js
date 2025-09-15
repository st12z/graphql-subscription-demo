import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
export const connectDB = async () => {
  try{
    await mongoose.connect(MONGO_URI);
  }catch(err){
    console.log("Connect to database failed");
  }
}