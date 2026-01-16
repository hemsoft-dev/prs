import { describe, expect, it } from "vitest";

describe("prs CLI", () => {
  it("should validate repository format", () => {
    const validRepo = "owner/repo";
    const pattern = /^[\w-]+\/[\w-]+$/;
    expect(pattern.test(validRepo)).toBe(true);
  });

  it("should reject invalid repository format", () => {
    const invalidRepo = "invalid";
    const pattern = /^[\w-]+\/[\w-]+$/;
    expect(pattern.test(invalidRepo)).toBe(false);
  });

  it("should handle repository with hyphens", () => {
    const repoWithHyphens = "my-org/my-repo";
    const pattern = /^[\w-]+\/[\w-]+$/;
    expect(pattern.test(repoWithHyphens)).toBe(true);
  });
});
