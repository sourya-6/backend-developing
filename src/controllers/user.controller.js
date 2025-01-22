import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import { ReturnDocument } from "mongodb"
import {sendWelcomeEmail} from "../utils/sendEmail.js"
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
    console.log('hello')
    console.log(req.body)
    const{fullName,email,username,password}=req.body//taking them from the html body Using form(data)
    // console.log("email:",email)
    
    
    if(
        [fullName,email,username,password].some((field)=>//some is used for returning boolean value either yes or no
            field?.trim() === ""//trim used to trim out the white spaces
        )
    ){   
        throw new ApiError(404,"All fields are mandatory")
    }
   console.log('hey')

    const existedUser= await User.findOne({//checks whether the user is present or not in the database
        //not returns false it returns null
        $or:[{username:req.body.username},{email:req.body.email}]//if email or username exists it returns the values 
    })
    console.log("existedUser",existedUser)
    try{
        if(existedUser){
            throw new ApiError(400,"User already exists").send(res)
        }
    }
    catch(err){
        next(err)
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
    console.log("check")
    console.log(email,fullName)
    sendWelcomeEmail(email,fullName);

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"//deselects th password and the refresh token
    )
    console.log("check")
    console.log(email,fullName)
    sendWelcomeEmail(email,fullName);

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
    

    const {username,email,password}=req.body
    

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
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
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
            // $set:{ //some places these method was used
            //     refreshToken:undefined
            // }
            $unset:{ //here we use these to remove the refreshToken by changing it flag to 1
                refreshToken:1,
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
//access token is a short lived one which have like a span in hours or a day accessed by user when user logged in using password not stored in database (contains all the information)
//refresh token is a long termed token which has a long life span like months used to refresh the access token just id is stored in database(contains only the id )
const refreshToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;//taking refresh token either from body or cookies
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access")
    }

    try {
        const decodedToken=jwt.verify(//verifying with incoming and the environments REFRESH_TOKEN_SECRET
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is generated or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        //here refreshToken is stored in newrefreshtoken
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("RefreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "AcessToken refreshed Successfully"
            
            )
        )
    } catch (error) {
        throw new ApiError(401,"Access Token Not Generated");
        
    }
})

const ChangeCurrentPassword=asyncHandler(async(req,res)=>{
  
    console.log(req.body)
    const {oldPassword,newPassword}=req.body;//taking the data from the body
    console.log(oldPassword,newPassword)
    console.log(req.user)
    // console.log(user._id)
    const user=await User.findById(req.user?._id)//
    console.log(user)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"User Details Fetched Successfully"))
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {newfullName,newemail}=req.body;
    console.log(newfullName,newemail)
    
    if(!newfullName||!newemail){
        throw new ApiError(401,"All Fields are mandatory")
    }
    console.log("hello")
    console.log(req.user._id)
    console.log(req.user.fullName)
    const user=await User.findByIdAndUpdate(
        
        req.user?._id,
        {
            $set:{
                fullName:newfullName,
                email:newemail
            }
        },
        {new:true}
    ).select("-password")
    console.log("good")
    console.log(user.fullName)
    console.log(user.email)
    
    if(!user){
        throw new ApiError(400,"Updating the user failed")
    }
    console.log(100)
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details Updated Successfully"))
})

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarlocalPath=req.file?.path
    console.log("avatarlocalPath")

    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarlocalPath)
    console.log("avatar")
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    else{
        console.log("ok")
    }

    const user=await User.findByIdAndUpdate(
        
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
    console.log('hey')
    console.log(user.avatar)
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})


const updatecoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)


    const user=await User.findByIdAndUpdate(//fetching the User and updating from it
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")//- used to not to select that field

    return res
    .status(200)
    .json(new ApiResponse(200,user,"coverImage Updated Successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    console.log(req.params)
    const {username}=req.params;
    console.log(username)
    if(!username?.trim()){
        throw new ApiError(400,"User is missing")
    }
    console.log('hi')
    const channel=await User.aggregate([
        {
            $match:{//used to check whether the value is True or False
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
            
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                SubscriberCount:{
                    $size:"$subscribers"
                },
                ToSubscribedCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullName:1,
                email:1,
                username:1,
                SubscriberCount:1,
                ToSubscribedCount,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    if(!channel?.length()){
        new ApiError(404,"Channel doesn't exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User fetched successfully")
    )
})
//here we are getting watch history which is a field inside the users .
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId.isValid(req.user._id),//req.user._id is already a object id so wrapping it may cause error
            },
            //we are fetching the watch history from the videos model where we used lookup
            //lookup performs a left join operation which uses four field
            //from:the foreign model
            //localfield:for which we are going to fetch
            //foreign Field:based on what criteria we are fetching
            //as:name its our wish
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[//we need the owner details which was also an user so we are using a subpipeline to fetch it
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{//project used to fetch only required fiels from all existing fields
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }

                    },
                    {
                        $addFields:{//can add or modify fields
                            owner:{//we are overwritting the owner field
                                $first:"$owner"//need to extract from field so we using '$'
                                //if there are multiple values we are fetching the first one
                                //here we using first for we are getting multiple arrays while using lookup so we using the first
                            }
                        }
                    }
                ]
            },
            
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})


export {registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    ChangeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
    
}