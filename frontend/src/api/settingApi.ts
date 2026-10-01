export interface Setting {
    id: number;
    name: string;
    key: string;
    value: string | null;
    description: string | null;
}

export interface SettingInput {
    name: string;
    key: string;
    value?: string;
    description?: string;
}

interface CountResponse {
    count: number;
  }

const API_URL = "http://localhost:3000";

export async function getSettings(): Promise<Setting[]> {
    const response = await fetch(`${API_URL}/api/settings`);

    if (!response.ok) {
        throw new Error("Failed to fetch settings");
    }

    return response.json();
}

export async function createSetting(
    data: SettingInput
): Promise<Setting> {
    const response = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.message ?? "Failed to create setting"
        );
    }

    return response.json();
}

export async function updateSetting(
    id: number,
    data: SettingInput
): Promise<Setting> {
    const response = await fetch(`${API_URL}/api/settings/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.message ?? "Failed to update setting"
        );
    }

    return response.json();
}

export async function deleteSetting(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/settings/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.message ?? "Failed to delete setting"
        );
    }
}

export async function countSettings(): Promise<number> {
    const response = await fetch(`${API_URL}/api/settings/count`, {
        method: "GET"
    });
    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.message ?? "Failed to count settings"
        );
    };
    const data: CountResponse = await response.json();

    return data.count;
}