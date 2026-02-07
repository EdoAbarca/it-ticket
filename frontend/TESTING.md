# Frontend Testing Guide

## Overview

This frontend application uses **Vitest** and **React Testing Library** for unit testing. The test suite ensures code quality, reliability, and maintainability of React components, services, and stores.

## Testing Stack

- **Vitest**: Fast unit test framework optimized for Vite projects
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage report
```bash
npm test:coverage
```

### Run tests with UI
```bash
npm test:ui
```

## Test Structure

### Component Tests
Located alongside components with `.test.jsx` or `.test.js` extension:
- `src/components/ProtectedRoute.test.jsx`
- `src/components/CommentSection.test.jsx`
- `src/pages/Login.test.jsx`

### Store Tests
Located alongside store files:
- `src/store/authStore.test.js`

### Service Tests
Located alongside service files:
- `src/services/api.test.js`

## Writing Tests

### Basic Component Test
```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing User Interactions
```javascript
import { fireEvent, waitFor } from '@testing-library/react';

it('handles button click', async () => {
  render(<MyComponent />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Mocking Dependencies
```javascript
import { vi } from 'vitest';

vi.mock('../services/api');
vi.mock('../store/authStore');
```

## Test Coverage Goals

- **Minimum coverage**: 70%
- **Components**: All major components should have tests
- **Services**: All API service methods should be tested
- **Stores**: State management logic should be thoroughly tested
- **Edge cases**: Error handling and validation should be covered

## Best Practices

1. **Test behavior, not implementation**: Focus on what users see and do
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies**: API calls, stores, routing
4. **Keep tests isolated**: Each test should be independent
5. **Use descriptive test names**: Clearly state what is being tested
6. **Test error states**: Don't just test the happy path
7. **Clean up after tests**: Use `afterEach(cleanup)` from Testing Library

## Common Patterns

### Testing Forms
```javascript
it('submits form with valid data', async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Testing Protected Routes
```javascript
it('redirects to login when not authenticated', () => {
  useAuthStore.mockReturnValue({ isAuthenticated: false });
  
  render(
    <BrowserRouter>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </BrowserRouter>
  );
  
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
```

### Testing Async Operations
```javascript
it('loads and displays data', async () => {
  api.fetchData.mockResolvedValue({ data: 'test' });
  
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests are automatically run in the CI pipeline on:
- Pull requests
- Pushes to main branch
- Before deployment

## Troubleshooting

### Tests timing out
- Increase timeout in `vitest.config.js`
- Check for unresolved promises
- Ensure all async operations are properly awaited

### Mock not working
- Verify mock path matches import path
- Check that mock is hoisted (vi.mock at top level)
- Clear mocks between tests with `vi.clearAllMocks()`

### DOM queries failing
- Use `screen.debug()` to see current DOM state
- Check if element is async-rendered (use `findBy` queries)
- Verify element is not hidden or removed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
