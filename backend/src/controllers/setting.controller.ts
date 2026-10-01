import { Request, Response } from "express";
import { createSetting, getSettings, getSettingById, updateSetting, deleteSetting, countSettings } from "../services/setting.service.js";
import { createSettingSchema } from "../validators/setting.validator.js";

export async function createSettingController(
  req: Request,
  res: Response
) {
  const data = createSettingSchema.parse(req.body);

  const setting = await createSetting(
    data.name,
    data.key,
    data.value,
    data.description
  );

  res.status(201).json(setting);
}

export async function getSettingsController(req: Request, res: Response) {
    const settings = await getSettings();
    res.json(settings);
}

export async function getSettingByIdController(req: Request, res: Response) {
    const { id } = req.params;
    const setting = await getSettingById(Number(id));
    res.json(setting);
}

export async function updateSettingController(req: Request, res: Response) {
    const { id } = req.params;
    const { name, key, value, description } = req.body;
    const setting = await updateSetting(Number(id), { name, key, value, description });
    res.json(setting);
}

export async function deleteSettingController(req: Request, res: Response) {
    const { id } = req.params;
    await deleteSetting(Number(id));
    res.status(204).send();
}

export async function countSettingsController(
  req: Request,
  res: Response
) {
  const count = await countSettings();

  res.json({
    count
  });
}