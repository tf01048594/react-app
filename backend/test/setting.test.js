import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test("GET /api/settings/count returns settings count", async () => {
  const response = await request(app)
    .get("/api/settings/count")
    .expect(200);

  assert.equal(typeof response.body.count, "number");
});