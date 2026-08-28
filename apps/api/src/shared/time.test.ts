import { describe, expect, test } from "bun:test";
import { parseDurationToSeconds } from "./time";

describe("parseDurationToSeconds", () => {
  test("parses minutes", () => {
    expect(parseDurationToSeconds("15m")).toBe(15 * 60);
  });

  test("parses days", () => {
    expect(parseDurationToSeconds("7d")).toBe(7 * 60 * 60 * 24);
  });

  test("throws on an invalid format", () => {
    expect(() => parseDurationToSeconds("bogus")).toThrow();
  });
});
