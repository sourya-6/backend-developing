import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"
const app=express()
//initializing cors
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))//shows the how much space is needed
app.use(express.urlencoded({extended:true,limit:"16kb"}))//used for how to use whitespace
app.use(express.static("public"))
export{ app }
