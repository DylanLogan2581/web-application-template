import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

const baseCommand =
  'npx standard-version --preset conventionalcommits --releaseCommitMessageFormat "chore(repo): release v%s"';

function run(command: string): string {
  return execSync(command, { encoding: "utf8", stdio: "pipe" });
}

function runInherit(command: string): void {
  execSync(command, { stdio: "inherit" });
}

function hasAnyTag(): boolean {
  try {
    run("git describe --tags --abbrev=0");
    return true;
  } catch {
    return false;
  }
}

function shouldForcePatch(base: string): boolean {
  const dryRunOutput = run(`${base} --dry-run`);
  return dryRunOutput.includes(" to null");
}

function buildReleaseCommand(): string {
  const commandParts = [baseCommand];

  if (!hasAnyTag()) {
    commandParts.push("--first-release");
  } else if (shouldForcePatch(baseCommand)) {
    commandParts.push("--release-as patch");
  }

  if (isDryRun) {
    commandParts.push("--dry-run");
  }

  return commandParts.join(" ");
}

const releaseCommand = buildReleaseCommand();
runInherit(releaseCommand);

if (!isDryRun) {
  runInherit("git push --follow-tags origin main");
}
