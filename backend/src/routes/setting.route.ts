import { Router } from "express";
import { countSettingsController, createSettingController, deleteSettingController, getSettingByIdController, getSettingsController, updateSettingController } from "../controllers/setting.controller.js";
import { getSettings } from "../services/setting.service.js";

const router = Router();


router.get("/count", countSettingsController);
router.post("/", createSettingController);
router.get("/", getSettingsController);
router.get("/:id", getSettingByIdController);
router.put("/:id", updateSettingController);
router.delete("/:id", deleteSettingController);

export default router;