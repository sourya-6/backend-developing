import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    const{fullName,email,username,password}=req.body
    console.log("email:",email)
    
    
    if(
        [fullName,email,username,password].some((field)=>//some is used for returning boolean value either yes or no
            field?.trim() === ""//trim used to trim out the white spaces
        )
    ){
        throw new ApiError(404,"All fields are mandatory")
    }
   

    const existedUser= await User.findOne({//checks whether the user is present or not in the database
        $or:[{username},{password}]
    })
    if(existedUser){
        throw new ApiError(409,"user name already existed try with other one")
    }

    console.log("fullName:",fullName)
    
    console.log("username:",username)
    const avatarlocalPath=req.files?.avatar[0]?.path
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
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Some thing went wrong while regestering!!")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered successfully")
    )
})


export {registerUser}