import mongoose from "mongoose";
const userSchema =new mongoose.Schema({
  username: String,
  password:String,
  status:{
    type:String,
    default:"deactive"
  },
  timeOnl:Date,
  deleted:{
    type:Boolean,
    default:false
  },
  avatar:{
    type:String,
  },
  requestFriends:[],
  acceptFriends:[],
  isFriends:[],
},{
  timestamps:true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
userSchema.virtual('id').get(function() {
  return this._id.toString();
});
const User = mongoose.model("User",userSchema,"users");
export default User;