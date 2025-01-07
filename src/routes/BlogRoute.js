import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createBlog,getAllBlog,getBlogById,getBlogByCategory, likeBlog,unlikeBlog,addComment } from "../controllers/BlogController.js";
const router=Router();

router.route("/create").post(verifyToken,createBlog);
router.route("/").get(getAllBlog);
router.route("/:blog").get(getBlogById);
router.route("/category/:category").get(getBlogByCategory);
router.route("/like/:blog").get(verifyToken,likeBlog);
router.route("/unlike/:blog").get(verifyToken,unlikeBlog);
router.route("/comment/:blogId").post(verifyToken,addComment);
export default router;