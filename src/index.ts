/* eslint-disable @typescript-eslint/camelcase */

import { setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/action';

import { isGitHubActions, debug } from './actions';
import { getPullRequestNumber } from './get-pull-request-number';
import { getCoverageReport } from './get-coverage-report';
import { getMessage } from './get-message';

const commentIdentifier = '<!-- uncovered-action-comment -->';

const run = async (): Promise<void> => {
  if (!isGitHubActions()) {
    console.log(await getMessage(commentIdentifier, false));

    return;
  }

  debug('process.env', process.env);
  debug('context', context);

  try {
    const githubRepo = process.env.GITHUB_REPOSITORY;

    if (!githubRepo) {
      setFailed('No repo found');

      return;
    }

    const [owner, repo] = githubRepo.split('/');
    const pullRequestNumber =
      context.payload.pull_request?.number || (await getPullRequestNumber());

    if (pullRequestNumber) {
      console.log('Found pull request, posting comment');

      const octokit = new Octokit();
      const comments = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: pullRequestNumber
      });
      const existingComment = comments.data.find(comment =>
        comment.body.includes(commentIdentifier)
      );

      existingComment
        ? console.log('Updating existing comment')
        : console.log('Posting new comment');

      const message = await getMessage(commentIdentifier, !!existingComment);

      if (message) {
        if (existingComment) {
          octokit.issues.updateComment({
            ...context.repo,
            comment_id: existingComment.id,
            body: message
          });
        } else {
          octokit.issues.createComment({
            ...context.repo,
            issue_number: pullRequestNumber,
            body: message
          });
        }
      }
    } else {
      console.log('No pull request found');

      await getCoverageReport();
    }
  } catch (error) {
    setFailed(error.message);
  }
};

run();
