import { isGitHubActions } from '../src/actions';

describe('actions', () => {
  test('isGitHubActions true', () => {
    process.env.GITHUB_WORKSPACE = 'something';
    expect(isGitHubActions()).toBe(true);
  });

  test('isGitHubActions false', () => {
    delete process.env.GITHUB_WORKSPACE;
    expect(isGitHubActions()).toBe(false);
  });
});
