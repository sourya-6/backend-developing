// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js"

// import express from "express"
//                               

dotenv.config({
    path:'./.env'
})


connectDB()
//if ',' mentioned in the PORT of env it will not some times comments also danger
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{ 
        console.log(`Hurray Server Running At ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO db Connection Failed man:",err)
})
