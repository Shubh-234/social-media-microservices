const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    userName : {
        type : String,
        required: true,
        trim : true,
        unique : true
    },
    email : {
        type : String,
        required: true,
        trim : true,
        unique : true,
        lowercase : true
    },
    password : {
        type : String,
        required: true,
    }
},{
    timestamps : true
})

//courtesy to this we dont have to do the hashing separately in user controller 
//this hashes the password before saving the user to the db
userSchema.pre("save",async function (next){
    if(this.isModified("password")){
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
})

//checking the password while loggin in 
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password,candidatePassword);
    } catch (error) {
        throw error;
    }
}


userSchema.index({ userName: "text" });

const User = mongoose.model("User",userSchema);

module.exports = User;