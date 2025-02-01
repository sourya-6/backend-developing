import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
   
    if(!content?.trim()){
        throw new ApiError(400,"No Content is present")
    }
    const tweet=await Tweet.create({
        content,
        owner:req.user._id
    });
    if(!tweet){
        throw new ApiError(500,"Something Went wrong")//internal server error
    }
    return res
    .status(200)
    .json(new ApiResponse(201,tweet,"Tweeted Successfully"))
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}=req.params
    console.log(userId)
    if(!userId ||!isValidObjectId(userId)){
        throw new ApiError(400,"Tweet Id not found")
    }

    const userTweet=await Tweet.findById(userId)
    console.log(userTweet)
    if(!userTweet){
        throw new ApiError(400,"Users have no tweets")
    }

    return res.
    status(200).
    json(
        new ApiResponse(200,userTweet,"User Tweets fetched successfully")
    )
    

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {newTweet}=req.body
    const {tweetId}=req.params
    if(!newTweet?.trim()){
        throw new ApiError(400,"No Tweet to Update")
    }
    if(!tweetId||isValidObjectId(tweetId)){
        throw new ApiError(401,"Invalid tweet ID")
    }

    const oldtweet=await Tweet.findById(tweetId)
    if(!oldtweet){
        throw new ApiError(400,"There is no old tweets with these tweet Id")
    }

    
    const updatedTweet= Tweet.findByIdAndUpdate(
        tweetId,//id
        {
            set:{content:newTweet}//updating
        },
        {
            new:true
        }
    )
    if(!updatedTweet){
        throw new ApiError(401,"Tweet not able to updated")
    }
    return res.
    status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params
    if(!tweetId||isValidObjectId(tweetId)){
        throw new ApiError(401,"Invalid Tweet Id")
    }

    const tweet=await Tweet.findById(tweetId)
    const {user}=req.body._id
    if(tweet.owner!=user){
        throw new ApiError(402,"Tweet can only be deleted by owner")
    }
    const response=await Tweet.findByIdAndDelete(tweetId)

    if(!response){
        throw new ApiError(401,"Something went wrong while deleting")
    }
    return res.status(201).json(new ApiResponse(201,{},"Tweet Deleted successfully"))

    

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
