import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { title } from "process"


const getAllVideos = asyncHandler(async (req, res) => {
    console.log(req.query)
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    console.log(query, sortBy, sortType, userId)
    
    //page:default is 1
    //limit: max upto 10 videos(default)
    //query:  search string for title or descn
    //sortBy:title/descrn
    //sortType:asc or desc
    
    //TODO: get all videos based on query, sort, pagination
    console.log(req.Video)
    if(!query||!query.trim()==""){
        throw new ApiError(400,"Query is required")
    }
    
    //steps:-
    //we used a match to find like "mogodb"
    //or is used here whether the given mogodb may be in title or descrn of video
    //regex is used for finding partial matches like atlasmogodb main se mogodb
    //Options:"i" uses like incasesensitive("MoGoDb")
    const videos=await Video.aggregate([
        {
            $match:{
                $or:[
                  {
                    title:{$regex:query,options:"i"}
                  },
                  {
                    description:{$regex:query,options:"i"}
                  }
                ]   
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            avatar:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                owner:1,
                isPublished:1,
                _id:1
            }
        }
    ])
    if(!videos){
        throw new ApiError(401,"Error while fetching video details")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title.trim()||!description.trim()){
        throw new ApiError(400,"Title and description is needed")
    }
    
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400,"No thumbnail Found")
    }

    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        console.log(500,"Error while uploading thumbnail")
    }
    
    const videoFileLocalPath=req.files?.videoFile[0]?.path
    if(!videoFileLocalPath){
        throw new ApiError(401,"No Video File Found")
    }
    
    const videoFile=await uploadOnCloudinary(videoFileLocalPath)
    console.log(videoFile)
    if(!videoFile.url){
        throw new ApiError(500,"Error while publishing video ")
    }
    console.log("duration?")
    const videoDuration=videoFile.duration
    console.log(videoDuration)
    if(!videoDuration){
        throw new ApiError(400,"Video Duration not fetched")
    }
    
    
  
    

    const video=await Video.create({
        videoFile:videoFile.url,
        title:title,
        description:description,
        thumbnail:thumbnail.url,
        duration:videoDuration,
        owner:req.user._id
    })
    if(!video){
        throw new ApiError(500,"Error while publishing a video");
        
    }
    return res.status(200).json(new ApiResponse(200,video,"Video Published Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId||!videoId.trim()){
        throw new ApiError(400,"Invalid video Id")
    }

    const video=await Video.aggregate([
        {
            $match:{
                videoId:videoId
            }
        },
        //fetching details of owner
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"owner"
            }
        }

    ])
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const video=await Video.findByIdAndUpdate(videoId,[
        
    ])

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
