import express, { type Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router: Router = express.Router();
const authController = new AuthController();

// Auth Controller Routes
router.post("/login", authController.login.bind(authController));
router.post("/register", authController.register.bind(authController));

export default router;
