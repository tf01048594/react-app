import prisma from "../lib/prisma.js";

export function createSetting(
  name: string,
  key: string,
  value?: string,
  description?: string
) {
  return prisma.setting.create({
    data: {
      name,
      key,
      value,
      description
    }
  });
}

export function getSettings() {
    return prisma.setting.findMany({
      orderBy: {
        id: "asc"
      }
    });
}

export function getSettingById(id: number) {
    return prisma.setting.findUnique({
        where: { id }
    });
}

export function updateSetting(id: number, data: { name?: string; key?: string; value?: string; description?: string }) {
    return prisma.setting.update({
        where: { id },
        data
    });
}

export function deleteSetting(id: number) {
    return prisma.setting.delete({
        where: { id }
    });
}

export function countSettings() {
  return prisma.setting.count();
}