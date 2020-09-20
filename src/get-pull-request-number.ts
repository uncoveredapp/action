import { context } from '@actions/github';
import { Octokit } from '@octokit/action';

import { debug } from './actions';

interface RepositoryResponse {
  repository?: {
    pullRequests?: {
      nodes: {
        title: string;
        number: number;
        commits: {
          nodes: {
            commit: {
              oid: string;
            };
          }[];
        };
      }[];
    };
  };
}

const getPullRequestNumber = async (): Promise<number | undefined> => {
  const owner = context.payload.repository?.organization;
  const name = context.payload.repository?.name;
  const headRefName = context.ref.replace('refs/heads/', '');
  const sha = context.sha;

  debug(owner, name, headRefName, sha);

  if (owner && name && headRefName && sha) {
    console.log('Finding pull request for commit');

    const octokit = new Octokit();

    const results = await octokit.graphql<RepositoryResponse>(`
      {
        repository(owner: "${owner}", name: "${name}") {
          pullRequests(last: 10 headRefName: "${headRefName}") {
            nodes {
              title
              number
              commits(last: 10) {
                nodes {
                  commit {
                    oid
                  }
                }
              }
            }
          }
        }
      }
    `);

    debug('results', results);

    if (results.repository?.pullRequests?.nodes) {
      for (const pullRequest of results.repository?.pullRequests?.nodes) {
        if (pullRequest.commits.nodes.find(commitNode => commitNode.commit.oid === sha)) {
          return pullRequest.number;
        }
      }
    }
  }

  console.log('Unable to find pull request for commit');

  return undefined;
};

export { getPullRequestNumber };
