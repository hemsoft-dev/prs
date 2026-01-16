import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/loader.js";

describe("loadConfig", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let testDir: string;

  beforeEach(() => {
    // Note: vi.resetModules() not available in Bun's Vitest
    process.env = { ...originalEnv };

    // Create a temp directory for test files
    testDir = join(tmpdir(), `prs-test-${Date.now()}`);
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should load default configuration", () => {
    // Clear any environment variables that might interfere
    delete process.env.GITHUB_ORG;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    delete process.env.BITBUCKET_WORKSPACE;
    delete process.env.BITBUCKET_USERNAME;
    delete process.env.BITBUCKET_API_KEY;
    delete process.env.BITBUCKET_USER_DISPLAY_NAME;
    delete process.env.SKIP_BITBUCKET;
    delete process.env.WATCH_INTERVAL;

    const config = loadConfig();

    expect(config.github.org).toBe("relias-engineering");
    expect(config.github.token).toBeUndefined();
    expect(config.bitbucket.workspace).toBe("relias");
    expect(config.bitbucket.userDisplayName).toBe("Franz Hemmer");
    expect(config.skipBitbucket).toBe(false);
    expect(config.watchInterval).toBe(15);
    // Note: accounts may be loaded from local .prs.json if it exists
  });

  it("should override defaults with environment variables", () => {
    process.env.GITHUB_ORG = "my-org";
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.BITBUCKET_WORKSPACE = "my-workspace";
    process.env.BITBUCKET_USERNAME = "testuser";
    process.env.BITBUCKET_API_KEY = "test-key";
    process.env.BITBUCKET_USER_DISPLAY_NAME = "Test User";
    process.env.SKIP_BITBUCKET = "true";
    process.env.WATCH_INTERVAL = "30";

    const config = loadConfig();

    expect(config.github.org).toBe("my-org");
    expect(config.github.token).toBe("ghp_test");
    expect(config.bitbucket.workspace).toBe("my-workspace");
    expect(config.bitbucket.username).toBe("testuser");
    expect(config.bitbucket.apiKey).toBe("test-key");
    expect(config.bitbucket.userDisplayName).toBe("Test User");
    expect(config.skipBitbucket).toBe(true);
    expect(config.watchInterval).toBe(30);
  });

  it("should accept GH_TOKEN as alternative to GITHUB_TOKEN", () => {
    process.env.GH_TOKEN = "ghp_alternative";

    const config = loadConfig();

    expect(config.github.token).toBe("ghp_alternative");
  });

  it("should prefer GITHUB_TOKEN over GH_TOKEN", () => {
    process.env.GITHUB_TOKEN = "ghp_primary";
    process.env.GH_TOKEN = "ghp_fallback";

    const config = loadConfig();

    expect(config.github.token).toBe("ghp_primary");
  });

  it("should load config from local .prs.json file", () => {
    const configPath = join(testDir, ".prs.json");
    const configData = {
      github: {
        org: "file-org",
      },
      bitbucket: {
        workspace: "file-workspace",
      },
      watchInterval: 20,
    };

    writeFileSync(configPath, JSON.stringify(configData));
    process.chdir(testDir);

    const config = loadConfig();

    expect(config.github.org).toBe("file-org");
    expect(config.bitbucket.workspace).toBe("file-workspace");
    expect(config.watchInterval).toBe(20);
  });

  it("should handle invalid JSON in config file gracefully", () => {
    const configPath = join(testDir, ".prs.json");
    writeFileSync(configPath, "{ invalid json }");
    process.chdir(testDir);

    // Should fall back to defaults without throwing
    const config = loadConfig();

    expect(config.github.org).toBe("relias-engineering");
  });

  it("should prefer environment variables over file config", () => {
    const configPath = join(testDir, ".prs.json");
    const configData = {
      github: {
        org: "file-org",
      },
    };

    writeFileSync(configPath, JSON.stringify(configData));
    process.chdir(testDir);
    process.env.GITHUB_ORG = "env-org";

    const config = loadConfig();

    expect(config.github.org).toBe("env-org");
  });
});
