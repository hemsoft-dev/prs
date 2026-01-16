# prs

Tool to check PR assignments and do agentic analysis on PR's

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
