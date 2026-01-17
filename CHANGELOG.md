# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-01-16

### Changed

- Removed company-specific default values from configuration
- Updated default organization to "your-org" (was company-specific)
- Updated default workspace to "your-workspace" (was company-specific)
- Updated default user display name to "Your Name" (was company-specific)
- Removed company-specific author name transformation logic

## [0.1.0] - 2026-01-16

### Added

- **Multi-account GitHub support**: Check PRs across multiple GitHub accounts with automatic account switching
- **Interactive setup wizard** (`prs init`): Guided configuration for GitHub accounts, organizations, and Bitbucket
- **Beautiful table UI**: Color-coded PR display with clickable hyperlinks, dynamic terminal width scaling
- **Rotating splash texts**: 150+ amusing loading messages while fetching PR data
- **Smart first-run experience**: Auto-detects single GitHub account, prompts for setup with multiple accounts
- **HemSoft config location**: Unified configuration at `~/hemsoft/prs/config.json`
- **Three PR viewing modes**:
  - Default: PRs assigned to you
  - `--approved-open`: PRs you approved that are still open
  - `--approved-merged-since <date>`: PRs you approved that merged since a date
- **Watch mode**: Auto-refresh every 15 minutes (configurable with `--watch`)
- **GitHub + Bitbucket support**: Check PRs from both platforms simultaneously
- **Auth verification**: `prs auth-check` command to verify GitHub CLI authentication

### Technical

- Built with Bun runtime and TypeScript (strict mode)
- Uses `gh` CLI for GitHub authentication and API access
- CLI built with Commander.js
- Beautiful tables with cli-table3, chalk, and terminal-link
- Config validation with Zod
- Comprehensive test suite with Vitest (90%+ coverage)
- Code quality enforced with Biome linter
- Pre-commit hooks with Husky and lint-staged

[unreleased]: https://github.com/HemSoft/prs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/HemSoft/prs/releases/tag/v0.1.0
