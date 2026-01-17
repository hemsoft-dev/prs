# Agent Instructions

## Project Overview

**prs**: Tool to check PR assignments and do agentic analysis on PR's

## Tech Stack

- **Runtime**: Bun (development) / Node.js (npm distribution)
- **Language**: TypeScript (strict mode)
- **Linting**: Biome
- **Testing**: Vitest (90%+ coverage required)
- **Console**: consola
- **CLI Parsing**: commander
- **Distribution**: npm package (@hemsoft/prs)
- **Required External Tool**: GitHub CLI (`gh`)

## Development

```bash
# Install dependencies
bun install

# Run in watch mode
bun run dev

# Build
bun run build

# Build executable
bun run build:exe

# Test
bun test

# Test with coverage
bun run test:coverage

# Lint
bun run lint

# Lint and fix
bun run lint:fix

# Type check
bun run type-check
```

## Quality Requirements

### CRITICAL: Clean Builds Required

ALL code changes MUST pass:

1. **Type checking**: `bun run type-check` with zero errors
2. **Linting**: `bun run lint` with zero errors/warnings
3. **Testing**: `bun run test:coverage` with 90%+ coverage
4. **Pre-commit hooks**: Auto-enforced on commit

### Code Style

- Use Biome defaults (enforced automatically)
- Prefer functional patterns over imperative
- Use Zod for runtime validation
- Use consola for console output (structured logging)
- Avoid `any` types (use `unknown` and narrow)

### Testing Standards

- Write tests BEFORE implementation (TDD encouraged)
- Test coverage must be ≥90% for all metrics (lines, functions, branches, statements)
- Use descriptive test names: `describe("feature", () => { it("should do X when Y", ...) })`
- Mock external dependencies
- Test both happy paths and error cases

### Error Handling

- Never swallow errors silently
- Use proper exit codes (0 = success, 1+ = failure)
- Log errors with consola.error before exiting
- Provide actionable error messages

### Environment Variables

If using environment variables, validate with Zod:

```typescript
import { z } from "zod";

const envSchema = z.object({
  API_KEY: z.string().min(1),
  DEBUG: z.enum(["true", "false"]).optional(),
});

export const env = envSchema.parse(process.env);
```

## Project Structure

```
.
├── src/
│   ├── index.ts          # Entry point
│   ├── utils/            # Utility functions
│   └── types/            # Type definitions
├── tests/
│   └── *.test.ts         # Test files
├── dist/                 # Build output
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions
├── biome.json            # Biome config
├── vitest.config.ts      # Vitest config
├── tsconfig.json         # TypeScript config
└── package.json
```

## Git Workflow

- Branch naming: `feature/`, `fix/`, `chore/`
- Commit format: `type(scope): message` (conventional commits)
- Pre-commit hooks enforce quality gates
- CI runs on all PRs

## Release Management

### CHANGELOG.md

- Maintain a **single, concise CHANGELOG.md** at the repository root
- Each entry MUST correlate to an npm release version
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Update CHANGELOG.md BEFORE releasing to npm
- Use semantic versioning (MAJOR.MINOR.PATCH)

### Release Checklist

Before publishing to npm:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with new version and date
3. Run all quality checks: `bun run type-check && bun run lint && bun run test:coverage`
4. Build: `bun run build`
5. Commit changes: `git commit -am "chore: release v0.x.x"`
6. Tag release: `git tag v0.x.x`
7. Push: `git push && git push --tags`
8. Publish: `npm publish --access public`

## Notes for AI Agents

- Always run `bun run lint:fix` before committing
- Run `bun run test:coverage` to verify coverage thresholds
- Use path aliases (`@/`) for cleaner imports
- **CRITICAL**: Do NOT use Bun-specific APIs in source code (e.g., `Bun.spawn`, `$` shell)
  - Use Node.js equivalents: `child_process.exec` with `promisify`
  - Build target is `--target node` for npm distribution
- Version should be read from `package.json`, never hardcoded
- Local `.prs.json` config files can interfere with tests - temporarily rename during test runs
- Pre-commit hooks will block commits if tests fail - fix tests before attempting to commit
- Cannot republish same npm version - must bump version number for any changes
- GitHub CLI (`gh`) is a hard dependency - tool architecture relies on it for auth and API access

## Common Pitfalls & Solutions

### Issue: Package works with Bun but fails with Node.js

**Cause**: Using Bun-specific APIs like `Bun.spawn`, `Bun.$`, or other Bun runtime features

**Solution**: 
- Replace `Bun.spawn` with Node.js `child_process.exec` using `promisify`
- Replace Bun's `$` shell with standard Node.js child process APIs
- Always test built output with Node.js: `node dist/index.js --version`

### Issue: Tests expect different default values

**Cause**: Local `.prs.json` config file being loaded during tests

**Solution**:
- `.prs.json` is in `.gitignore` for development use
- Temporarily rename it during test runs: `Rename-Item .prs.json .prs.json.dev`
- Or run tests from clean temp directory

### Issue: npm publish fails with "cannot publish over existing version"

**Cause**: Trying to republish same version number

**Solution**:
- Bump version in `package.json`
- Update `CHANGELOG.md` with new version entry
- Commit, tag, and republish
- Consider using `npm version patch/minor/major` to automate

### Issue: CLI shows wrong version number

**Cause**: Version hardcoded in source instead of reading from package.json

**Solution**:
```typescript
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
const version = packageJson.version;
```

## Build Targets

- **Development**: Run with `bun run dev` using Bun runtime
- **npm Distribution**: Build with `--target node` for Node.js compatibility
- **Windows Executable**: Build with `--target bun-windows-x64 --compile` (Bun-only, not for npm)

## Configuration Locations

Priority order (highest to lowest):
1. `./.prs.json` - Local project config (gitignored, for development)
2. `~/hemsoft/prs/config.json` - Standard user config location
3. `~/.prs.json` - Legacy location (deprecated)
4. Environment variables - Override any config value
