//using promise method

const asyncHandler=(requestHandler)=>{return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next.err)
}}
export{asyncHandler}
//using try catch method
// const asyncHandler =(fn)=>async (req,res,next)=>{//creating a function inside a function
//     try{
//         await fn(req,res,next)
//     }
//     catch(err){
//         res.status(err.code||500).json({
//             success:false,
//             message:err.message
//             })
//     }

// }