# Contributing to MyFPnA Suite

Thank you for your interest in contributing to MyFPnA Suite! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node.js version)

### Suggesting Features

Feature requests are welcome! Please create an issue with:

- A clear description of the feature
- Use cases and benefits
- Any relevant examples or mockups

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** (`pnpm test`)
6. **Submit a pull request** with a clear description

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/myfpna.git
   cd myfpna
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (see README.md)

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Follow existing code style and patterns
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper prop typing with TypeScript

### tRPC Procedures

- Define procedures in `server/routers.ts`
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints
- Add input validation with Zod schemas

### Database

- Define schema changes in `drizzle/schema.ts`
- Run `pnpm db:push` to apply migrations
- Add query helpers in `server/db.ts`
- Use transactions for multi-step operations

### Testing

- Write tests for new features
- Use Vitest for unit and integration tests
- Test both success and error cases
- Aim for meaningful test coverage

### Styling

- Use Tailwind CSS utility classes
- Follow existing design patterns
- Use shadcn/ui components when possible
- Ensure responsive design (mobile, tablet, desktop)

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(forecasting): add ARIMA forecasting model
fix(budget): correct variance calculation for negative values
docs(readme): update installation instructions
```

## Project Structure

```
client/          # Frontend React application
server/          # Backend Express + tRPC
drizzle/         # Database schema and migrations
shared/          # Shared types and constants
storage/         # S3 storage helpers
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('scenario.create', () => {
  it('creates a new scenario successfully', async () => {
    const caller = appRouter.createCaller(mockContext);
    const result = await caller.scenario.create({
      name: 'Test Scenario',
      scenarioType: 'budget',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Scenario');
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for complex functions
- Document new environment variables
- Update API documentation for new endpoints

## Review Process

1. All pull requests require review before merging
2. Address reviewer feedback promptly
3. Keep PRs focused and reasonably sized
4. Ensure CI checks pass

## Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Review the documentation in README.md
- Contact the maintainers via email

## License

By contributing to MyFPnA Suite, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MyFPnA Suite! 🎉
