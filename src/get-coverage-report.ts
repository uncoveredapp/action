import path from 'path';
import { promisify } from 'util';
import { getInput } from '@actions/core';
import parse from 'lcov-parse';
import Table from 'cli-table3';

import { debug } from './actions';
import { uploadCoverage } from './upload-coverage';

export interface ProjectCoverage {
  lines: {
    found: number;
    hit: number;
  };
  functions: {
    found: number;
    hit: number;
  };
  branches: {
    found: number;
    hit: number;
  };
}

export interface CoverageReport {
  head: {
    lines: string;
    functions: string;
    branches: string;
  };
  base: {
    lines: string;
    functions: string;
    branches: string;
  };
  change: {
    lines: string;
    functions: string;
    branches: string;
  };
}

const getCoverageReport = async (): Promise<CoverageReport> => {
  const coverageDirectory = getInput('coverageDirectory') || 'coverage';
  const parseCoverage = promisify(parse);

  const projectCoverage: ProjectCoverage[] = await parseCoverage(
    path.join(coverageDirectory, 'lcov.info')
  );
  const coverage = projectCoverage.reduce(
    (results, file) => {
      return {
        lines: {
          found: results.lines.found + file.lines.found,
          hit: results.lines.hit + file.lines.hit
        },
        functions: {
          found: results.functions.found + file.functions.found,
          hit: results.functions.hit + file.functions.hit
        },
        branches: {
          found: results.branches.found + file.branches.found,
          hit: results.branches.hit + file.branches.hit
        }
      };
    },
    {
      lines: {
        found: 0,
        hit: 0
      },
      functions: {
        found: 0,
        hit: 0
      },
      branches: {
        found: 0,
        hit: 0
      }
    }
  );
  const linesPercent = Math.round((coverage.lines.hit / coverage.lines.found) * 10_000) / 100;
  const functionsPercent =
    Math.round((coverage.functions.hit / coverage.functions.found) * 10_000) / 100;
  const branchesPercent =
    Math.round((coverage.branches.hit / coverage.branches.found) * 10_000) / 100;

  debug('head coverage', {
    lines: linesPercent,
    functions: functionsPercent,
    branches: branchesPercent
  });

  const baseCoverage = await uploadCoverage(linesPercent, functionsPercent, branchesPercent);

  debug('base coverage', baseCoverage);

  const lines = !isNaN(linesPercent) ? linesPercent : undefined;
  const functions = !isNaN(functionsPercent) ? functionsPercent : undefined;
  const branches = !isNaN(branchesPercent) ? branchesPercent : undefined;
  const baseLines = baseCoverage?.baseLines || undefined;
  const baseFunctions = baseCoverage?.baseFunctions || undefined;
  const baseBranches = baseCoverage?.baseBranches || undefined;
  const linesDiff = lines && baseLines ? baseLines - lines : undefined;
  const functionsDiff = functions && baseFunctions ? baseFunctions - functions : undefined;
  const branchesDiff = branches && baseBranches ? baseBranches - branches : undefined;

  const coverageReport = {
    head: {
      lines: lines ? `${lines}%` : '',
      functions: functions ? `${functions}%` : '',
      branches: branches ? `${branches}%` : ''
    },
    base: {
      lines: baseLines ? `${baseLines}%` : '',
      functions: baseFunctions ? `${baseFunctions}%` : '',
      branches: baseBranches ? `${baseBranches}%` : ''
    },
    change: {
      lines: linesDiff !== undefined ? `${linesDiff}%` : '',
      functions: functionsDiff !== undefined ? `${functionsDiff}%` : '',
      branches: branchesDiff !== undefined ? `${branchesDiff}%` : ''
    }
  };

  const coverageTable = new Table({
    head: ['', 'Head', 'Base', 'Change']
  });

  coverageTable.push([
    'Lines',
    coverageReport.head.lines,
    coverageReport.base.lines,
    coverageReport.change.lines
  ]);
  coverageTable.push([
    'Functions',
    coverageReport.head.functions,
    coverageReport.base.functions,
    coverageReport.change.functions
  ]);
  coverageTable.push([
    'Branches',
    coverageReport.head.branches,
    coverageReport.base.branches,
    coverageReport.change.branches
  ]);

  console.log(coverageTable.toString());

  return coverageReport;
};

export { getCoverageReport };
