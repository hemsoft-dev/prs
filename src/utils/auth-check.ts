import { consola } from "consola";

/**
 * Utility to check GitHub authentication status
 * This can be used standalone or imported by other tools
 */
export async function checkGitHubAuth(org?: string): Promise<boolean> {
  // Check if gh is installed
  try {
    const versionProc = Bun.spawn(["gh", "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await versionProc.exited;

    if (versionProc.exitCode !== 0) {
      consola.error("❌ GitHub CLI (gh) is not installed or not in PATH.");
      consola.info("   Install from: https://cli.github.com/");
      return false;
    }
  } catch {
    consola.error("❌ GitHub CLI (gh) is not installed or not in PATH.");
    consola.info("   Install from: https://cli.github.com/");
    return false;
  }

  // Check if authenticated
  const authProc = Bun.spawn(["gh", "auth", "status"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  await authProc.exited;

  if (authProc.exitCode !== 0) {
    consola.error("❌ GitHub CLI is not authenticated.");
    consola.info("   Run: gh auth login");
    return false;
  }

  // Get current user
  const userProc = Bun.spawn(["gh", "api", "user", "--jq", ".login"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const userText = await new Response(userProc.stdout).text();
  await userProc.exited;

  if (userProc.exitCode !== 0) {
    consola.error("❌ Could not get current GitHub user.");
    consola.info("   Your authentication may have expired. Try:");
    consola.info("   gh auth refresh");
    return false;
  }

  const currentUser = userText.trim();
  consola.success(`✓ Authenticated as: ${currentUser}`);

  // If org is provided, check access
  if (org) {
    const orgProc = Bun.spawn(["gh", "repo", "list", org, "--limit", "1", "--json", "name"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const orgErr = await new Response(orgProc.stderr).text();
    await orgProc.exited;

    if (orgProc.exitCode !== 0) {
      if (orgErr.includes("404") || orgErr.includes("Not Found")) {
        consola.error(`❌ Organization '${org}' not found or you don't have access to it.`);
      } else if (orgErr.includes("403") || orgErr.includes("Forbidden")) {
        consola.error(`❌ Access denied to organization '${org}'.`);
      } else {
        consola.error(`❌ Failed to access organization '${org}'.`);
        consola.debug(orgErr);
      }
      return false;
    }

    consola.success(`✓ Access to organization: ${org}`);
  }

  return true;
}
