import mongoose,{Schema} from "mongoose"
const playlistSchema=new Schema (
    {
        name:{
            Type:String,
            required:true
        },
        description:{
            Type:String,
            required:true
        },
        videos:{
            Type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            Type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const Playlist=mongoose.model("Playlist",playlistSchema)