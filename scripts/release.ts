import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

const baseCommand =
  'npx standard-version --preset conventionalcommits --releaseCommitMessageFormat "chore(repo): release v%s"';

function runInherit(command: string): void {
  execSync(command, { stdio: "inherit" });
}

function hasAnyTag(): boolean {
  try {
    execSync("git describe --tags --abbrev=0", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function buildReleaseCommand(): string {
  const commandParts = [baseCommand];

  if (!hasAnyTag()) {
    // No previous tags — treat this as the first release
    commandParts.push("--first-release");
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
