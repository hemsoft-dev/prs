# prs

Tool to check PR assignments and do agentic analysis on PRs across GitHub and Bitbucket.

## Features

- 🔍 **Multi-platform**: Check PRs from GitHub and Bitbucket simultaneously
- ⚙️ **Flexible Configuration**: Environment variables, config files, or CLI options
- 🔄 **Watch Mode**: Continuous monitoring with configurable refresh intervals
- 📊 **Filtered Views**: Show approved PRs, merged PRs, or all PRs you're involved with
- 🎯 **Smart Detection**: Uses gh CLI for GitHub and REST API for Bitbucket

## Installation

```bash
bun install
bun run build:exe
```

## Configuration

Configuration is loaded from multiple sources (highest priority first):

1. **Environment variables**
2. **Local config file** (`./.prs.json`)
3. **User config file** (`~/.prs.json`)
4. **Defaults**

### Environment Variables

```bash
# GitHub
GITHUB_ORG=relias-engineering
GITHUB_TOKEN=ghp_xxx           # Optional, uses gh CLI auth by default
GH_TOKEN=ghp_xxx               # Alternative to GITHUB_TOKEN

# Bitbucket
BITBUCKET_WORKSPACE=relias
BITBUCKET_USERNAME=your-username
BITBUCKET_API_KEY=your-api-key
BITBUCKET_USER_DISPLAY_NAME="Franz Hemmer"

# Behavior
SKIP_BITBUCKET=false
WATCH_INTERVAL=15
```

### Config File Example

Create `.prs.json` in your home directory or project root:

```json
{
  "github": {
    "org": "relias-engineering",
    "accounts": [
      { "account": "HemSoft", "org": "HemSoft" },
      { "account": "franzhemmer", "org": "HemSoft" },
      { "account": "fhemmerrelias", "org": "relias-engineering" }
    ]
  },
  "bitbucket": {
    "workspace": "relias",
    "userDisplayName": "Franz Hemmer"
  },
  "skipBitbucket": false,
  "watchInterval": 15
}
```

**Multi-Account Support:**
- If you have multiple GitHub accounts authenticated via `gh`, you can specify which accounts to check
- Each account can check a different organization
- If `accounts` is not specified, only the active `gh` account will be used

See [.prs.json.example](.prs.json.example) for a full example.

## Usage

### Basic Commands

```bash
# Check GitHub authentication status
prs auth-check

# Check authentication for a specific org
prs auth-check --org my-organization

# Run in watch mode (default: refreshes every 15 minutes)
prs

# Run once and exit
prs --once

# List PRs you've approved that are still open
prs --approved-open

# List PRs you've approved that were merged since a date
prs --approved-merged-since 2025-01-01

# Custom watch interval (in minutes)
prs --watch 30

# Skip Bitbucket checks
prs --skip-bitbucket

# Enable debug output
prs --debug
```

### Examples

```bash
# Verify your GitHub authentication before running
prs auth-check

# Quick check of all open PRs
prs --once

# Watch for new PRs every 10 minutes
prs --watch 10

# GitHub only, watch mode
prs --skip-bitbucket

# Check merged PRs from last week
prs --approved-merged-since 2025-01-09 --once
```

## Troubleshooting

### GitHub Authentication Issues

If you see errors about missing PRs or authentication:

1. **Check your authentication status:**
   ```bash
   prs auth-check
   # or
   gh auth status
   ```

2. **Authenticate with GitHub CLI:**
   ```bash
   gh auth login
   ```
   Make sure to select the account that has access to your organization.

3. **Refresh expired tokens:**
   ```bash
   gh auth refresh
   ```

4. **Switch accounts if needed:**
   ```bash
   gh auth switch
   ```

5. **Verify organization access:**
   ```bash
   prs auth-check --org relias-engineering
   ```

## Requirements

- **Bun** runtime
- **gh CLI** (for GitHub integration) - Install from https://cli.github.com/
- **Bitbucket credentials** (optional, for Bitbucket integration)

## Installation

```bash
bun install
```

## Usage

```bash
bun run dev
```

## Build

```bash
# Build JavaScript bundle
bun run build

# Build standalone executable (Windows)
bun run build:exe
```

## Testing

```bash
# Run tests in watch mode
bun test

# Run tests once with coverage
bun run test:coverage
```

## Quality Gates

- **Linting**: Biome (strict mode)
- **Type Safety**: TypeScript strict mode
- **Test Coverage**: 90%+ required
- **Pre-commit**: Auto-lint and test on commit

## License

MIT
