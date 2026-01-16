import { describe, expect, it } from "vitest";
import {
  BitbucketParticipantSchema,
  BitbucketPullRequestSchema,
  BitbucketRepositorySchema,
} from "../../src/types/bitbucket.js";

describe("Bitbucket Type Schemas", () => {
  describe("BitbucketParticipantSchema", () => {
    it("should validate participant", () => {
      const participant = {
        user: {
          uuid: "{123-456}",
          display_name: "Test User",
        },
        approved: true,
      };

      const result = BitbucketParticipantSchema.parse(participant);

      expect(result).toEqual(participant);
    });
  });

  describe("BitbucketRepositorySchema", () => {
    it("should validate repository", () => {
      const repo = {
        name: "test-repo",
        full_name: "workspace/test-repo",
        updated_on: "2025-01-15T10:00:00Z",
      };

      const result = BitbucketRepositorySchema.parse(repo);

      expect(result).toEqual(repo);
    });

    it("should allow optional updated_on", () => {
      const repo = {
        name: "test-repo",
        full_name: "workspace/test-repo",
      };

      const result = BitbucketRepositorySchema.parse(repo);

      expect(result.updated_on).toBeUndefined();
    });
  });

  describe("BitbucketPullRequestSchema", () => {
    it("should validate complete PR", () => {
      const pr = {
        id: 123,
        title: "Test PR",
        state: "OPEN",
        author: {
          display_name: "Test User",
        },
        links: {
          html: {
            href: "https://bitbucket.org/workspace/repo/pull-requests/123",
          },
        },
        participants: [
          {
            user: {
              uuid: "{123-456}",
              display_name: "Reviewer",
            },
            approved: true,
          },
        ],
        reviewers: [
          {
            uuid: "{789-012}",
            display_name: "Reviewer 2",
          },
        ],
        created_on: "2025-01-15T10:00:00Z",
        updated_on: "2025-01-16T10:00:00Z",
        merged_on: null,
      };

      const result = BitbucketPullRequestSchema.parse(pr);

      expect(result).toEqual(pr);
    });

    it("should validate all PR states", () => {
      const states = ["OPEN", "MERGED", "DECLINED", "SUPERSEDED"];

      for (const state of states) {
        const pr = {
          id: 123,
          title: "Test PR",
          state,
          author: {
            display_name: "Test User",
          },
          links: {
            html: {
              href: "https://bitbucket.org/workspace/repo/pull-requests/123",
            },
          },
        };

        const result = BitbucketPullRequestSchema.parse(pr);
        expect(result.state).toBe(state);
      }
    });

    it("should allow optional fields", () => {
      const pr = {
        id: 123,
        title: "Test PR",
        state: "OPEN",
        author: {
          display_name: "Test User",
        },
        links: {
          html: {
            href: "https://bitbucket.org/workspace/repo/pull-requests/123",
          },
        },
      };

      const result = BitbucketPullRequestSchema.parse(pr);

      expect(result.participants).toBeUndefined();
      expect(result.reviewers).toBeUndefined();
      expect(result.created_on).toBeUndefined();
    });
  });
});
