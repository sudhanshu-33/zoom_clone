import express from "express";

import {createServer} from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManeger.js";

import cors from "cors";
import userRoutes from "./routes/user.routes.js";

const app =express();
const server =createServer(app);
const io = connectToSocket(server);


app.set("port" , (process.env.PORT || 8000)); 
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit :"40kb" , extended : true}));
app.use("/api/v1/users" , userRoutes);


const start =async () =>{
    app.set("mongo_user")
    const connectiondb = await mongoose.connect("mongodb+srv://sudhanshu_VC:Ki488Ol5nqJ6uwbS@cluster0.1t9nm.mongodb.net/");
    console.log(`MONGO Connected DB host ${connectiondb.connection.host}`);
    server.listen(app.get("port"), () =>{
        console.log("listening on port 8000");
    });
}
start();