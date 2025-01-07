import { Router } from "express";

import { register,login, logout } from "../controllers/UserController.js";
import { refreshtoken } from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router=Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refreshtoken").get(refreshtoken);
router.route("/logout").delete(verifyToken,logout);
export default router;