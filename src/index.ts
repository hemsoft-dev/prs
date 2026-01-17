#!/usr/bin/env node
import { existsSync } from "node:fs";
import chalk from "chalk";
import Table from "cli-table3";
import { Command } from "commander";
import { consola } from "consola";
import terminalLink from "terminal-link";
import { BitbucketClient } from "./api/bitbucket.js";
import { GitHubClient, type PullRequest } from "./api/github.js";
import { getConfigPath, loadConfig } from "./config/loader.js";
import { checkGitHubAuth } from "./utils/auth-check.js";
import {
  checkGitHubCLI,
  getGitHubAccounts,
  runInteractiveSetup,
} from "./utils/interactive-setup.js";
import { getRandomSplashText } from "./utils/splash-texts.js";

const program = new Command();

program
  .name("prs")
  .description("Tool to check PR assignments and do agentic analysis on PRs")
  .version("1.0.0");

// Add init command
program
  .command("init")
  .description("Create a configuration file interactively")
  .action(async () => {
    try {
      // Run interactive setup
      await runInteractiveSetup();
    } catch (error) {
      consola.error("Setup failed:", error);
      process.exit(1);
    }
  });

// Add auth-check command
program
  .command("auth-check")
  .description("Check GitHub authentication status and organization access")
  .option("--org <organization>", "Organization to check access for")
  .action(async (options: { org?: string }) => {
    const config = loadConfig();
    const org = options.org || config.github.org;

    consola.info(`Checking GitHub authentication for organization: ${org}\n`);
    const isValid = await checkGitHubAuth(org);

    process.exit(isValid ? 0 : 1);
  });

// Main command
program
  .option("-a, --approved-open", "List PRs you have approved that are still open", false)
  .option(
    "-m, --approved-merged-since <date>",
    "List PRs you have approved that have been merged since the specified date (YYYY-MM-DD)",
  )
  .option("-o, --once", "Run once and exit (default is watch mode)", false)
  .option("-w, --watch <minutes>", "Refresh interval in minutes for watch mode", "15")
  .option("--skip-bitbucket", "Skip Bitbucket checks (GitHub only)", false)
  .option("-d, --debug", "Enable debug mode", false)
  .action(
    async (options: {
      approvedOpen: boolean;
      approvedMergedSince?: string;
      once: boolean;
      watch: string;
      skipBitbucket: boolean;
      debug: boolean;
    }) => {
      if (options.debug) {
        consola.level = 5; // Set to debug level
        consola.debug("Debug mode enabled");
        consola.debug("Options:", options);
      }

      try {
        // Load configuration
        const config = loadConfig();

        // Override config with CLI flags
        if (options.skipBitbucket) {
          config.skipBitbucket = true;
        }

        // Initialize clients
        const githubClient = new GitHubClient(config.github);
        const bitbucketClient = new BitbucketClient(config.bitbucket);
        const watchInterval = Number.parseInt(options.watch, 10);
        if (!Number.isNaN(watchInterval)) {
          config.watchInterval = watchInterval;
        }

        // Determine mode
        let mode: "default" | "approved-open" | "approved-merged-since" = "default";
        let dateStr: string | undefined;

        if (options.approvedOpen) {
          mode = "approved-open";
        } else if (options.approvedMergedSince) {
          mode = "approved-merged-since";
          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(options.approvedMergedSince)) {
            consola.error("Invalid date format. Use YYYY-MM-DD");
            process.exit(1);
          }
          dateStr = options.approvedMergedSince;
        }

        // Check for first-run scenario
        const configPath = getConfigPath();
        const hasConfig = existsSync(configPath);

        if (!hasConfig) {
          // Check if GitHub CLI is available
          const hasGH = await checkGitHubCLI();
          if (!hasGH) {
            consola.error("❌ GitHub CLI not found!");
            console.log("");
            consola.info("Please install GitHub CLI:");
            consola.info("  Windows:  winget install --id GitHub.cli");
            consola.info("  macOS:    brew install gh");
            consola.info("  Linux:    https://github.com/cli/cli#installation");
            console.log("");
            consola.info("After installing, run: prs init");
            process.exit(1);
          }

          // Check for single account auto-config
          const accounts = await getGitHubAccounts();
          if (accounts.length === 0) {
            consola.error("❌ No authenticated GitHub accounts found!");
            console.log("");
            consola.info("Please authenticate with GitHub first:");
            consola.info("  gh auth login");
            console.log("");
            consola.info("Then run: prs init");
            process.exit(1);
          }

          if (accounts.length > 1) {
            consola.warn(`Found ${accounts.length} GitHub accounts: ${accounts.join(", ")}`);
            console.log("");
            consola.info("Please run setup to configure which accounts to use:");
            consola.info("  prs init");
            process.exit(1);
          }

          // Single account - auto-configure!
          consola.info(
            `✨ Auto-configuring for GitHub account: ${accounts[0]} (org: ${accounts[0]})`,
          );
          consola.info("💡 Run 'prs init' to customize configuration or add more accounts.");
          console.log("");
        }

        // st bitbucketClient = new BitbucketClient(config.bitbucket);

        const fetchAndDisplay = async () => {
          // Show rotating splash texts with inline animation
          let splashInterval: Timer | undefined;
          const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
          let frameIndex = 0;
          let currentText = getRandomSplashText();
          let lastTextChange = Date.now();

          const updateSpinner = () => {
            // Change text every 3 seconds
            if (Date.now() - lastTextChange > 3000) {
              currentText = getRandomSplashText();
              lastTextChange = Date.now();
            }

            // Update spinner frame
            const spinner = spinnerFrames[frameIndex % spinnerFrames.length];
            frameIndex++;

            // Clear line completely and rewrite
            process.stdout.write(`\r\x1b[K${chalk.cyan(spinner)} ${currentText}`);
          };

          // Update spinner every 80ms for smooth animation
          splashInterval = setInterval(updateSpinner, 80);

          // Fetch from both sources
          const [githubPRs, bitbucketPRs] = await Promise.all([
            githubClient.fetchPRs(mode, dateStr),
            config.skipBitbucket ? Promise.resolve([]) : bitbucketClient.fetchPRs(mode, dateStr),
          ]);

          // Stop spinner and clear line
          if (splashInterval) {
            clearInterval(splashInterval);
          }
          process.stdout.write("\r\x1b[K");

          const allPRs: PullRequest[] = [...githubPRs, ...bitbucketPRs];

          if (allPRs.length === 0) {
            consola.success("✅ All clear! No PRs found.");
            return;
          }

          // Sort by source, repository, and ID
          allPRs.sort((a, b) => {
            if (a.source !== b.source) {
              return a.source.localeCompare(b.source);
            }
            if (a.repository !== b.repository) {
              return a.repository.localeCompare(b.repository);
            }
            return a.id - b.id;
          });

          // Display results in a beautiful table
          console.clear();

          // Get terminal width
          const terminalWidth = process.stdout.columns || 120;

          // Calculate dynamic column widths based on terminal size
          const fixedWidths = {
            approved: 11,
            src: 5,
            number: 6,
            author: 16,
            date: 13,
          };
          const totalFixed = Object.values(fixedWidths).reduce((a, b) => a + b, 0);
          const borders = 14; // Space for borders and padding between columns
          const repositoryWidth = Math.max(
            18,
            Math.floor((terminalWidth - totalFixed - borders) * 0.25),
          );
          const titleWidth = Math.max(30, terminalWidth - totalFixed - repositoryWidth - borders);

          // Calculate actual table width (sum of all columns + table borders)
          // cli-table3 adds 1 char left border + 1 char right border + 1 char between each column (6 separators for 7 columns)
          const actualTableWidth = totalFixed + repositoryWidth + titleWidth + 8; // +8 for borders (left + right + 6 separators)

          // Title banner matches table width exactly
          const bannerWidth = actualTableWidth - 2; // -2 for the banner border characters
          const titleText = `Pull Requests (${allPRs.length} total)`;
          const padding = Math.max(0, Math.floor((bannerWidth - titleText.length) / 2));

          console.log(chalk.cyan.bold(`\n╔${"═".repeat(bannerWidth)}╗`));
          console.log(
            chalk.cyan.bold(
              `║${" ".repeat(padding)}${titleText}${" ".repeat(bannerWidth - padding - titleText.length)}║`,
            ),
          );
          console.log(chalk.cyan.bold(`╚${"═".repeat(bannerWidth)}╝\n`));

          const table = new Table({
            head: [
              chalk.cyan.bold("Approved"),
              chalk.cyan.bold("Src"),
              chalk.cyan.bold("Repository"),
              chalk.cyan.bold("#"),
              chalk.cyan.bold("Title"),
              chalk.cyan.bold("Author"),
              chalk.cyan.bold("Date"),
            ],
            style: {
              head: [],
              border: ["cyan"],
              compact: false,
            },
            chars: {
              top: "─",
              "top-mid": "┬",
              "top-left": "┌",
              "top-right": "┐",
              bottom: "─",
              "bottom-mid": "┴",
              "bottom-left": "└",
              "bottom-right": "┘",
              left: "│",
              "left-mid": "├",
              mid: "─",
              "mid-mid": "┼",
              right: "│",
              "right-mid": "┤",
              middle: "│",
            },
            colWidths: [
              fixedWidths.approved,
              fixedWidths.src,
              repositoryWidth,
              fixedWidths.number,
              titleWidth,
              fixedWidths.author,
              fixedWidths.date,
            ],
            wordWrap: false,
          });

          for (const pr of allPRs) {
            const total = pr.assigneeCount > 0 ? pr.assigneeCount.toString() : "?";
            const myApproval = pr.iApproved ? " ✅" : "";
            const approvalStr = `${pr.approvalCount}/${total}${myApproval}`;

            const src = pr.source === "GitHub" ? "GH" : "BB";

            // Truncate title to fit column
            let title = pr.title;
            const maxTitleLen = titleWidth - 4;
            if (title.length > maxTitleLen) {
              title = `${title.substring(0, maxTitleLen - 3)}...`;
            }

            // Create clickable link
            const titleLink = terminalLink(title, pr.url, { fallback: () => title });

            // Truncate repository name if needed
            let repoName = pr.repository;
            const maxRepoLen = repositoryWidth - 3;
            if (repoName.length > maxRepoLen) {
              repoName = `${repoName.substring(0, maxRepoLen - 3)}...`;
            }

            // Shorten author name if needed
            let author = pr.author;
            const maxAuthorLen = fixedWidths.author - 3;
            if (author.length > maxAuthorLen) {
              author = `${author.substring(0, maxAuthorLen - 3)}...`;
            }

            const dateStr = pr.created ? pr.created.toISOString().split("T")[0] : "N/A";

            table.push([
              approvalStr,
              chalk.yellow(src),
              chalk.green(repoName),
              chalk.blue(`#${pr.id}`),
              titleLink,
              author,
              chalk.gray(dateStr),
            ]);
          }

          console.log(table.toString());
          console.log("");
        };

        // Run once or in watch mode
        if (options.once) {
          await fetchAndDisplay();
        } else {
          consola.info(`Running in watch mode (refresh every ${config.watchInterval} minutes)`);
          consola.info("Press Ctrl+C to exit\n");

          while (true) {
            await fetchAndDisplay();
            const nextRun = new Date();
            nextRun.setMinutes(nextRun.getMinutes() + config.watchInterval);
            consola.info(
              `\nNext refresh at ${nextRun.toLocaleTimeString()}. Waiting ${config.watchInterval} minutes...`,
            );
            await Bun.sleep(config.watchInterval * 60 * 1000);
          }
        }

        process.exit(0);
      } catch (error) {
        consola.error("Failed:", error);
        process.exit(1);
      }
    },
  );

program.parse();
