import { buildCompletionMatrix, matrixSummary, tourSourceSnapshot } from '../src/data/tourSources';

const rows = buildCompletionMatrix(tourSourceSnapshot);
const summary = matrixSummary(rows);
const sourceFoldersFound = rows.filter((row) => row.sourceFolderFound === 'Yes').length;
const sourceFoldersMissing = rows.length - sourceFoldersFound;

console.log(`Drive snapshot: ${tourSourceSnapshot.rootFolder.title}`);
console.log(`Show folders inspected: ${rows.length}`);
console.log(`Source folders found: ${sourceFoldersFound}`);
console.log(`Source folders missing: ${sourceFoldersMissing}`);
console.log(`Logical relevant source files: ${summary.relevantFilesFound}`);
console.log(`Controlled Drive sources: ${summary.externalDriveSourceCount}`);
console.log(`Repo-copied sources: ${summary.repoSourceCount}`);
console.log(`Duplicate Drive locations: ${summary.duplicateSources}`);
console.log('Live Drive refresh: use the connected Google Drive session process documented in docs/tour-source-refresh-workflow.md; this npm command is intentionally offline for CI.');

