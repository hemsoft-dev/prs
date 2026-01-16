import { describe, expect, it } from "vitest";
import {
  GitHubPullRequestSchema,
  GitHubReviewSchema,
  GitHubSearchResultSchema,
} from "../../src/types/github.js";

describe("GitHub Type Schemas", () => {
  describe("GitHubReviewSchema", () => {
    it("should validate approved review", () => {
      const review = {
        state: "APPROVED",
        author: {
          login: "testuser",
        },
        submittedAt: "2025-01-15T10:00:00Z",
      };

      const result = GitHubReviewSchema.parse(review);

      expect(result).toEqual(review);
    });

    it("should validate all review states", () => {
      const states = ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", "DISMISSED", "PENDING"];

      for (const state of states) {
        const review = {
          state,
          author: { login: "testuser" },
        };

        const result = GitHubReviewSchema.parse(review);
        expect(result.state).toBe(state);
      }
    });
  });

  describe("GitHubPullRequestSchema", () => {
    it("should validate complete PR", () => {
      const pr = {
        number: 123,
        title: "Test PR",
        url: "https://github.com/org/repo/pull/123",
        state: "OPEN",
        author: {
          login: "testuser",
        },
        repository: {
          name: "test-repo",
        },
        reviews: [
          {
            state: "APPROVED",
            author: { login: "reviewer1" },
          },
        ],
        assignees: [
          {
            login: "assignee1",
          },
        ],
        createdAt: "2025-01-15T10:00:00Z",
        mergedAt: null,
      };

      const result = GitHubPullRequestSchema.parse(pr);

      expect(result).toEqual(pr);
    });

    it("should allow optional fields", () => {
      const pr = {
        number: 123,
        title: "Test PR",
        url: "https://github.com/org/repo/pull/123",
        state: "OPEN",
        author: {
          login: "testuser",
        },
        createdAt: "2025-01-15T10:00:00Z",
      };

      const result = GitHubPullRequestSchema.parse(pr);

      expect(result.repository).toBeUndefined();
      expect(result.reviews).toBeUndefined();
      expect(result.assignees).toBeUndefined();
    });
  });

  describe("GitHubSearchResultSchema", () => {
    it("should validate search result", () => {
      const result = {
        number: 123,
        title: "Test PR",
        url: "https://github.com/org/repo/pull/123",
        repository: {
          name: "test-repo",
        },
      };

      const parsed = GitHubSearchResultSchema.parse(result);

      expect(parsed).toEqual(result);
    });
  });
});
