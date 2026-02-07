import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { appError, errors } from "./errors";

describe("appError", () => {
  it("returns a ConvexError with correct structure", () => {
    const err = appError("NOT_FOUND", "Resource not found");
    expect(err).toBeInstanceOf(ConvexError);
    expect(err.data).toEqual({ code: "NOT_FOUND", message: "Resource not found" });
  });
});

describe("errors", () => {
  it("unauthenticated", () => {
    const err = errors.unauthenticated();
    expect(err.data).toEqual({ code: "UNAUTHENTICATED", message: "Not authenticated" });
  });

  it("unauthorized with default message", () => {
    const err = errors.unauthorized();
    expect(err.data).toEqual({ code: "UNAUTHORIZED", message: "Not authorized" });
  });

  it("unauthorized with custom message", () => {
    const err = errors.unauthorized("Custom msg");
    expect(err.data).toEqual({ code: "UNAUTHORIZED", message: "Custom msg" });
  });

  it("notFound", () => {
    const err = errors.notFound("Tournament");
    expect(err.data).toEqual({ code: "NOT_FOUND", message: "Tournament not found" });
  });

  it("invalidInput", () => {
    const err = errors.invalidInput("Bad data");
    expect(err.data).toEqual({ code: "INVALID_INPUT", message: "Bad data" });
  });

  it("invalidState", () => {
    const err = errors.invalidState("Not active");
    expect(err.data).toEqual({ code: "INVALID_STATE", message: "Not active" });
  });

  it("conflict", () => {
    const err = errors.conflict("Already exists");
    expect(err.data).toEqual({ code: "CONFLICT", message: "Already exists" });
  });

  it("limitExceeded", () => {
    const err = errors.limitExceeded("Too many");
    expect(err.data).toEqual({ code: "LIMIT_EXCEEDED", message: "Too many" });
  });

  it("internal", () => {
    const err = errors.internal("Something broke");
    expect(err.data).toEqual({ code: "INTERNAL_ERROR", message: "Something broke" });
  });
});
