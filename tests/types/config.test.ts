import { describe, expect, it } from "vitest";
import { BitbucketConfigSchema, ConfigSchema, GitHubConfigSchema } from "../../src/types/config.js";

describe("Config Schemas", () => {
  describe("GitHubConfigSchema", () => {
    it("should validate valid GitHub config", () => {
      const config = {
        org: "my-org",
        token: "ghp_test",
      };

      const result = GitHubConfigSchema.parse(config);

      expect(result).toEqual(config);
    });

    it("should use default org if not provided", () => {
      const config = {};

      const result = GitHubConfigSchema.parse(config);

      expect(result.org).toBe("your-org");
      expect(result.token).toBeUndefined();
    });

    it("should allow token to be optional", () => {
      const config = {
        org: "my-org",
      };

      const result = GitHubConfigSchema.parse(config);

      expect(result.token).toBeUndefined();
    });
  });

  describe("BitbucketConfigSchema", () => {
    it("should validate valid Bitbucket config", () => {
      const config = {
        workspace: "my-workspace",
        username: "testuser",
        apiKey: "test-key",
        userDisplayName: "Test User",
      };

      const result = BitbucketConfigSchema.parse(config);

      expect(result).toEqual(config);
    });

    it("should use defaults for optional fields", () => {
      const config = {};

      const result = BitbucketConfigSchema.parse(config);

      expect(result.workspace).toBe("your-workspace");
      expect(result.userDisplayName).toBe("Your Name");
      expect(result.username).toBeUndefined();
      expect(result.apiKey).toBeUndefined();
    });
  });

  describe("ConfigSchema", () => {
    it("should validate complete config", () => {
      const config = {
        github: {
          org: "my-org",
          token: "ghp_test",
        },
        bitbucket: {
          workspace: "my-workspace",
          username: "testuser",
          apiKey: "test-key",
          userDisplayName: "Test User",
        },
        skipBitbucket: true,
        watchInterval: 30,
      };

      const result = ConfigSchema.parse(config);

      expect(result).toEqual(config);
    });

    it("should use defaults", () => {
      const config = {
        github: {},
        bitbucket: {},
      };

      const result = ConfigSchema.parse(config);

      expect(result.skipBitbucket).toBe(false);
      expect(result.watchInterval).toBe(15);
    });

    it("should enforce minimum watch interval", () => {
      const config = {
        github: {},
        bitbucket: {},
        watchInterval: 0,
      };

      expect(() => ConfigSchema.parse(config)).toThrow();
    });
  });
});
