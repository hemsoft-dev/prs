import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { consola } from "consola";
import type { Config } from "../types/config.js";

/**
 * Check if GitHub CLI is installed
 */
export async function checkGitHubCLI(): Promise<boolean> {
  try {
    await $`gh --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get authenticated GitHub accounts from gh CLI
 */
export async function getGitHubAccounts(): Promise<string[]> {
  try {
    const result = await $`gh auth status`.quiet();
    const output = result.stderr.toString();

    const accounts: string[] = [];
    const regex = /✓\s+Logged in to github\.com account (\S+)/gi;
    let match: RegExpExecArray | null = null;

    match = regex.exec(output);
    while (match !== null) {
      if (match[1]) {
        accounts.push(match[1]);
      }
      match = regex.exec(output);
    }

    return accounts;
  } catch {
    return [];
  }
}

/**
 * Prompt user for input with default value
 */
async function prompt(message: string, defaultValue?: string): Promise<string> {
  const promptText = defaultValue ? `${message} (${defaultValue})` : message;
  consola.log(promptText);

  // Read from stdin
  const readline = require("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("", (answer: string) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Confirm yes/no question
 */
async function confirm(message: string, defaultYes = true): Promise<boolean> {
  const suffix = defaultYes ? " (Y/n)" : " (y/N)";
  const response = await prompt(`${message}${suffix}`);

  if (!response) {
    return defaultYes;
  }

  return response.toLowerCase().startsWith("y");
}

/**
 * Interactive setup wizard
 */
export async function runInteractiveSetup(): Promise<Config> {
  consola.box("🚀 Welcome to PRS Setup!");
  console.log("");

  // Step 1: Check GitHub CLI
  consola.start("Checking for GitHub CLI...");
  const hasGH = await checkGitHubCLI();

  if (!hasGH) {
    consola.error("❌ GitHub CLI not found!");
    console.log("");
    consola.info("Please install GitHub CLI first:");
    consola.info("  Windows:  winget install --id GitHub.cli");
    consola.info("  macOS:    brew install gh");
    consola.info("  Linux:    https://github.com/cli/cli#installation");
    console.log("");
    consola.info("After installing, run: gh auth login");
    process.exit(1);
  }

  consola.success("✅ GitHub CLI found!");
  console.log("");

  // Step 2: Detect GitHub accounts
  consola.start("Detecting authenticated GitHub accounts...");
  const accounts = await getGitHubAccounts();

  if (accounts.length === 0) {
    consola.error("❌ No authenticated GitHub accounts found!");
    console.log("");
    consola.info("Please authenticate with GitHub first:");
    consola.info("  gh auth login");
    process.exit(1);
  }

  consola.success(`✅ Found ${accounts.length} account(s): ${accounts.join(", ")}`);
  console.log("");

  // Step 3: Select accounts to use
  const selectedAccounts: Array<{ account: string; org: string }> = [];

  if (accounts.length === 1) {
    consola.info(`Using account: ${accounts[0]}`);
    const org = await prompt("What organization should we check PRs for?", accounts[0]);
    selectedAccounts.push({ account: accounts[0] as string, org });
  } else {
    consola.info("Multiple GitHub accounts detected!");
    const useAll = await confirm("Would you like to use all accounts?", true);

    if (useAll) {
      for (const account of accounts) {
        const org = await prompt(`Organization for ${account}?`, account);
        selectedAccounts.push({ account, org });
      }
    } else {
      // Manual selection
      for (const account of accounts) {
        const use = await confirm(`Include account: ${account}?`, true);
        if (use) {
          const org = await prompt(`  Organization for ${account}?`, account);
          selectedAccounts.push({ account, org });
        }
      }
    }
  }

  console.log("");

  // Step 4: Bitbucket configuration
  const useBitbucket = await confirm("Do you use Bitbucket?", false);
  console.log("");

  let bitbucketConfig:
    | {
        workspace: string;
        username?: string;
        apiKey?: string;
        userDisplayName: string;
      }
    | undefined;

  if (useBitbucket) {
    consola.info("Configuring Bitbucket...");
    const workspace = await prompt("Bitbucket workspace slug:");
    const username = await prompt("Bitbucket username (optional):");
    const apiKey = await prompt("Bitbucket App Password (optional):");
    const displayName = await prompt("Your display name:", "Franz Hemmer");

    bitbucketConfig = {
      workspace,
      username: username || undefined,
      apiKey: apiKey || undefined,
      userDisplayName: displayName,
    };
    console.log("");
  }

  // Step 5: Create config
  const config: Config = {
    github: {
      org: selectedAccounts[0]?.org || "your-org",
      accounts: selectedAccounts,
    },
    bitbucket: bitbucketConfig || {
      workspace: "your-workspace",
      userDisplayName: "Your Name",
    },
    skipBitbucket: !useBitbucket,
    watchInterval: 15,
  };

  // Step 6: Save config
  const configDir = join(homedir(), "hemsoft", "prs");
  const configPath = join(configDir, "config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  consola.success(`✅ Configuration saved to: ${configPath}`);
  console.log("");

  return config;
}
