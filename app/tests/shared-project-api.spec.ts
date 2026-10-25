import { test, expect } from "@playwright/test";

test("shared route validates input and reads the configured Neon table", async ({ request }) => {
  const invalid = await request.put("/api/te/project", { data: "not json", headers: { "Content-Type": "application/json" } });
  expect(invalid.status()).toBe(400);
  const available = await request.get("/api/te/project");
  expect(available.status()).toBe(200);
  const value = await available.json();
  expect(value.revision).toEqual(expect.any(Number));
  expect(value).toHaveProperty("project");
});
