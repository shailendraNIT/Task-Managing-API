const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const secretKey=process.env.JWT_SECRET


const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:7,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new mongoose.Error('Password can not "password" ');
            }
        }

    },
    age:{
        type:Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a positive number');
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{timestamps:true});


//tasks is an array such as tokens but it will not be stored in db .because it is virtual array
UserSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

UserSchema.methods.toJSON=function(){
    const user=this;
    const userObject=user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

UserSchema.methods.generateAuthToken=async function(){
    const user=this;

    const token=jwt.sign({_id:user.id.toString()},secretKey);

    user.tokens=user.tokens.concat({token});
    await user.save();
    return token;
}


//Statics are pretty much the same as methods but allow for defining functions that exist directly on your Model.
UserSchema.statics.findByCredentials=async function(email,password){
    
    const user=await User.findOne({email});
    if(!user){
        throw new Error('Could not find your email');
    }

    const isMatch=await bcrypt.compare(password,user.password);

    if(!isMatch){
        throw new Error('Unable to login.Check your password');
    }
    return user;
}


UserSchema.pre('save',async function(next){
    const user=this;
    if(user.isModified('password')){
        user.password=await bcrypt.hash(user.password,8);
    }
    next();
})


const User=mongoose.model('User',UserSchema);
module.exports=User;