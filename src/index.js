// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
import { app } from "./app.js"
import connectDB from "./db/index.js";
// import express from "express"
//                               

dotenv.config({
    path:'./env'
})


connectDB()

.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Hurray Server Running At:${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO db Connection Failed man:",err)
})
