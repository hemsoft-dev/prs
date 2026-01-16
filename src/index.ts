import { Command } from "commander";
import { consola } from "consola";
import { z } from "zod";

const program = new Command();

program
  .name("prs")
  .description("Tool to check PR assignments and do agentic analysis on PR's")
  .version("1.0.0")
  .argument("[repository]", "GitHub repository (format: owner/repo)")
  .option("-a, --assigned", "Show only PRs assigned to you", false)
  .option("-r, --review", "Show PRs requesting your review", false)
  .option("-d, --debug", "Enable debug mode", false)
  .action(
    async (
      repository: string | undefined,
      options: { assigned: boolean; review: boolean; debug: boolean },
    ) => {
      if (options.debug) {
        consola.debug("Debug mode enabled");
        consola.debug("Options:", options);
      }

      consola.start("Fetching PR information...");

      try {
        if (!repository) {
          consola.info(
            "No repository specified. Use 'prs owner/repo' to check a specific repository.",
          );
          process.exit(0);
        }

        // Validate repository format
        const repoSchema = z
          .string()
          .regex(/^[\w-]+\/[\w-]+$/, "Repository must be in format: owner/repo");
        const validatedRepo = repoSchema.parse(repository);

        // TODO: Implement PR fetching and analysis
        consola.info(`Analyzing PRs for ${validatedRepo}...`);

        if (options.assigned) {
          consola.info("Filtering for assigned PRs");
        }

        if (options.review) {
          consola.info("Filtering for review requests");
        }

        consola.success("Analysis complete!");
        process.exit(0);
      } catch (error) {
        if (error instanceof z.ZodError) {
          consola.error("Invalid input:", error.issues[0]?.message);
        } else {
          consola.error("Failed:", error);
        }
        process.exit(1);
      }
    },
  );

program.parse();
