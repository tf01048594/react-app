import test, { after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

function createTestSetting() {
    return {
        name: "Test setting",
        key: `test.key.${Date.now()}-${Math.random()}`,
        value: "123",
        description: "Created by integration test"
    };
}

test("GET /api/settings/count returns actual settings count", async () => {
    const expectedCount = await prisma.setting.count();

    const response = await request(app)
        .get("/api/settings/count")
        .expect(200);

    assert.equal(response.body.count, expectedCount);
});

test("GET /api/settings returns settings", async () => {
    const response = await request(app)
        .get("/api/settings")
        .expect(200);

    assert.ok(Array.isArray(response.body));
});

test("POST /api/settings creates a setting", async () => {
    const setting = createTestSetting();

    let createdId;

    try {
        const response = await request(app)
            .post("/api/settings")
            .send(setting)
            .expect(201);

        createdId = response.body.id;

        assert.equal(response.body.name, setting.name);
        assert.equal(response.body.key, setting.key);
        assert.equal(response.body.value, setting.value);
        assert.equal(response.body.description, setting.description);

        const created = await prisma.setting.findUnique({
            where: { id: createdId }
        });

        assert.ok(created);
        assert.equal(created.name, setting.name);
        assert.equal(created.key, setting.key);
    } finally {
        if (createdId) {
            await prisma.setting.delete({
                where: { id: createdId }
            });
        }
    }
});

test("POST /api/settings rejects invalid data", async () => {
    const response = await request(app)
        .post("/api/settings")
        .send({
            key: "invalid.test"
        })
        .expect(400);

    assert.ok(response.body);
});

test("GET /api/settings/:id returns a setting", async () => {
    const setting = createTestSetting();

    const created = await prisma.setting.create({
        data: setting
    });

    try {
        const response = await request(app)
            .get(`/api/settings/${created.id}`)
            .expect(200);

        assert.equal(response.body.id, created.id);
        assert.equal(response.body.name, setting.name);
        assert.equal(response.body.key, setting.key);
        assert.equal(response.body.value, setting.value);
        assert.equal(response.body.description, setting.description);
    } finally {
        await prisma.setting.delete({
            where: { id: created.id }
        });
    }
});

test("GET /api/settings/:id returns 404 when setting does not exist", async () => {
    const response = await request(app)
        .get("/api/settings/999999999")
        .expect(404);

    assert.ok(response.body);
});

test("PUT /api/settings/:id updates a setting", async () => {
    const setting = createTestSetting();

    const created = await prisma.setting.create({
        data: setting
    });

    try {
        const updatedData = {
            name: "Updated setting",
            value: "456",
            description: "Updated by integration test"
        };

        const response = await request(app)
            .put(`/api/settings/${created.id}`)
            .send(updatedData)
            .expect(200);

        assert.equal(response.body.id, created.id);
        assert.equal(response.body.name, updatedData.name);
        assert.equal(response.body.value, updatedData.value);
        assert.equal(response.body.description, updatedData.description);

        const updated = await prisma.setting.findUnique({
            where: { id: created.id }
        });

        assert.ok(updated);
        assert.equal(updated.name, updatedData.name);
        assert.equal(updated.value, updatedData.value);
        assert.equal(updated.description, updatedData.description);

        // key không được gửi nên phải giữ nguyên
        assert.equal(updated.key, setting.key);
    } finally {
        await prisma.setting.delete({
            where: { id: created.id }
        });
    }
});

test("DELETE /api/settings/:id deletes a setting", async () => {
    const setting = createTestSetting();

    const created = await prisma.setting.create({
        data: setting
    });

    await request(app)
    .delete(`/api/settings/${created.id}`)
    .expect(204);

    const deleted = await prisma.setting.findUnique({
        where: { id: created.id }
    });

    assert.equal(deleted, null);
});

test("DELETE /api/settings/:id returns 404 when setting does not exist", async () => {
    const response = await request(app)
        .delete("/api/settings/999999999")
        .expect(404);

    assert.ok(response.body);
});

after(async () => {
    await prisma.$disconnect();
});