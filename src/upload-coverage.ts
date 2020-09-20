import { getInput } from '@actions/core';
import axios from 'axios';

import { debug } from './actions';

export interface BaseCoverage {
  baseLines?: number;
  baseFunctions?: number;
  baseBranches?: number;
}

const uploadUrl = 'https://api.uncoveredapp.dev/coverage/upload';

const uploadCoverage = async (
  linesPercent: number,
  functionsPercent: number,
  branchesPercent: number
): Promise<BaseCoverage | undefined> => {
  const uploadToken = getInput('uncoveredToken');

  if (!uploadToken) {
    console.log('No upload token provided. You can generate one at https://uncoveredapp.dev');

    return;
  }

  const ref = process.env.GITHUB_HEAD_REF
    ? process.env.GITHUB_HEAD_REF
    : process.env.GITHUB_REF?.replace('refs/heads/', '');

  const baseRef = process.env.GITHUB_HEAD_REF
    ? process.env.GITHUB_HEAD_REF
    : process.env.GITHUB_REF?.replace('refs/heads/', '');

  const payload = {
    name: process.env.GITHUB_REPOSITORY,
    ref,
    baseRef,
    hash: process.env.GITHUB_SHA,
    ...(linesPercent && { lines: linesPercent }),
    ...(functionsPercent && { functions: functionsPercent }),
    ...(branchesPercent && { branches: branchesPercent }),
    actor: process.env.GITHUB_ACTOR
  };

  debug('payload', payload);

  const result = await axios.post(uploadUrl, payload, {
    headers: {
      Authorization: uploadToken
    }
  });

  debug('result', result.data);

  if (result.data) {
    return {
      baseLines: result.data.baseLines,
      baseFunctions: result.data.baseFunctions,
      baseBranches: result.data.baseBranches
    };
  }
};

export { uploadCoverage };
