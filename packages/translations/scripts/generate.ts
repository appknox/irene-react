import { formatProblems, generateMessages } from './utils/generate-messages.ts';

/*
  Flattens translations/<locale>.json into src/generated/<locale>.json and fails
  when the locales disagree, so a broken translation never reaches a build.
*/

const problems = generateMessages();

if (problems.length > 0) {
  console.error(formatProblems(problems));
  process.exit(1);
}
