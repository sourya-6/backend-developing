import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import { ReturnDocument } from "mongodb"
const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // res.status(200).json({
    //     message:"ok"
    // })

    const{fullName,email,username,password}=req.body//taking them from the html body Using form(data)
    // console.log("email:",email)
    
    
    if(
        [fullName,email,username,password].some((field)=>//some is used for returning boolean value either yes or no
            field?.trim() === ""//trim used to trim out the white spaces
        )
    ){   
        throw new ApiError(404,"All fields are mandatory")
    }
   

    const existedUser= await User.findOne({//checks whether the user is present or not in the database
        //not returns false it returns null
        $or:[{username},{email}]//if email or username exists it returns the values 
    })
    
    if(existedUser){
        throw new ApiError(409,"user name already existed try with other one")
    }
   

    
    const avatarlocalPath=req.files?.avatar[0]?.path//avatar is an array so it returns the first value
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(avatarlocalPath)

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {


        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(coverImageLocalPath)
    if(!avatarlocalPath){
        throw new ApiError(400,"Fetching avatar failed")
    }

    const avatar=await uploadOnCloudinary(avatarlocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Fetching avatar failed")
    }
    console.log("hello")

    const user= await User.create({
        
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    console.log(user)


    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"//deselects th password and the refresh token
    )
    if(!createdUser){
        throw new ApiError(500,"Some thing went wrong while regestering!!")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered successfully")
    )
})

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()//generates an access token from the reference of user.model
        const refreshToken=user.generateRefreshToken()//generates an refresh token from the reference of user.model
        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave:false })

        return{accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating the access and refresh tokens")
    }
}

const loginUser=asyncHandler(async(req,res)=>{
    //req body-->data
    //username or email
    //find the user
    //check for the password
    //access and refresh token generated
    //send cookie
    console.log("hhi")

    const {username,email,password}=req.body
    console.log("hello")

    // if(!username||!email){
    //     throw new ApiError(404,"username or email required")
    // }
    console.log(username,email)
    if(!username&&!email){
        throw new ApiError(404,"username or email required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })


    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }
    console.log(user)

    //password check
    const isPasswordValid=await user.isPasswordCorrect(password)
    console.log(isPasswordValid)
    if(!isPasswordValid){
        throw new ApiError(401,"Password is invalid")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedinUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200).
    cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
            
        },
        {
            new:true
        }
    
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;
    if(incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access")
    }

    const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user=await User.findById(decodedToken?._id)

    if(!user){
        console.log(401,"Invalid Refresh Token")
    }
})
export {registerUser,loginUser,logoutUser}