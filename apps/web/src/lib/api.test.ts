import { describe, expect, test } from "bun:test";
import { ApiError } from "./api";

describe("ApiError", () => {
  test("carries the http status alongside the message", () => {
    const err = new ApiError("Invalid credentials", 401);

    expect(err.message).toBe("Invalid credentials");
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});
