import request from "supertest";
import app from "../src/app.js";

describe("Auth", () => {
  it("logs in seeded consumer user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "User@123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", "user@test.com");
  });

  it("rejects admin endpoint for consumer token", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "User@123",
    });
    const token = login.body.accessToken;

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

