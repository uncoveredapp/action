import { debug } from './actions';
import { getCoverageReport } from './get-coverage-report';

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

const getMessage = async (
  commentIdentifier: string,
  existingComment: boolean
): Promise<string | undefined> => {
  if (existingComment) {
    debug('existing comment found');
  }

  const coverageReport = await getCoverageReport();

  const message = `## Test Coverage
| | Base | Head | Change |
| - | - | - | - |
| Lines | ${coverageReport.head.lines} | ${coverageReport.base.lines} | ${coverageReport.change.lines} |
| Functions | ${coverageReport.head.functions} | ${coverageReport.base.functions} | ${coverageReport.change.functions} |
| Branches | ${coverageReport.head.branches} | ${coverageReport.base.branches} | ${coverageReport.change.branches} |
${commentIdentifier}`;

  debug(message);

  return message;
};

export { getMessage };
