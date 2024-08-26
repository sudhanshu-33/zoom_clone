
import httpStatus from "http-status";
import {User} from "../models/user.models.js";
import crypto  from "crypto";
import bcryptjs ,{hash} from "bcrpytjs";


const login = async (req,res) =>{
    const {username,password} = req.body;
    if(!username || !password){
        return res.status(400).json({message :"please provide"});
    }
    try{
        const user =await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message : "user not found"});
        }
        if(bcrypt.compare(password , user.password)){
            let token =crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token : token});
        }
    }catch(e) {
        return res.status(500).json({message : `something went wrong ${e}`});
    }
}

const register = async (req,res) =>{
    const {name,username,password} = req.body;


    try{
        let existingUser = await User.findOne({ username });
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message : "user already exists"})
        }

        const hassedpassword = await bcryptjs.hash(password , 10);

        const newUser =new User({
            name :name,
            username : username,
            password : hassedpassword
        });

        await newUser.save();
        res.status(httpStatus.CREATED).json({message : "new user registered"});
    }catch (e){
        res.status(500).json({message :`Something went Wrong ${e}`});
    }
}
export {login , register};