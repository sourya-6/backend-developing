import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";
import multer from "multer";
import { publishAVideo } from "../controllers/video.controller.js";

const router=Router()
router.route(verifyJWT)
router.route("/Publish-Video").post(
    upload.fields([
        {
            name:"thumbnail",
            maxCount:1
        },
        {
            name:"videoFile",
            maxCount:1
        }
    ]),
    publishAVideo 
    )
router.use(verifyJWT)

export default router;