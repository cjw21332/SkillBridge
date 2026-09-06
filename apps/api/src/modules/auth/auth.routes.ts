import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { RegisterSchema, LoginSchema } from "@skillbridge/shared-types";

const router = Router();
router.post("/register", validate(RegisterSchema), authController.register);
router.post("/login", validate(LoginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/reset-password", authController.resetPassword);
router.get("/verify-email/:token", authController.verifyEmail);

export default router;
