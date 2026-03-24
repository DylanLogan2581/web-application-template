#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_SOURCE_REPO = "DylanLogan2581/web-application-template";
const TEMPLATE_REPO_NAME = "web-application-template";
const TEMPLATE_USER_LOGIN = "DylanLogan2581";

function main() {
  const options = parseArguments(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  ensureCommand("git");
  ensureCommand("gh");

  const targetRepo = options.repo ?? inferTargetRepo();
  const sourceRepo = options.source ?? DEFAULT_SOURCE_REPO;
  const maintainerLogin = options.maintainer ?? getAuthenticatedGitHubLogin();
  const targetRepoName = targetRepo.split("/")[1];
  const normalizedRepoName = normalizeRepositoryName(targetRepoName);

  logStep(`Bootstrapping ${targetRepo} from ${sourceRepo}`);
  logInfo(`Using GitHub maintainer login ${maintainerLogin} for local owner references.`);

  const sourceRepository = getRepositoryDetails(sourceRepo);
  const sourceBranchProtection = getBranchProtection(sourceRepo, sourceRepository.default_branch);
  const sourceVulnerabilityAlertsEnabled = isFeatureEnabled(
    `repos/${sourceRepo}/vulnerability-alerts`,
  );
  const sourceAutomatedSecurityFixesEnabled = isFeatureEnabled(
    `repos/${sourceRepo}/automated-security-fixes`,
  );
  const sourceAutolinks = getAutolinks(sourceRepo);

  applyRepositorySettings(targetRepo, sourceRepository);
  applySecurityFeatures(targetRepo, sourceRepository.security_and_analysis);
  syncVulnerabilityAlerts(targetRepo, sourceVulnerabilityAlertsEnabled);
  syncAutomatedSecurityFixes(targetRepo, sourceAutomatedSecurityFixesEnabled);
  syncLabels(sourceRepo, targetRepo);
  syncAutolinks(targetRepo, sourceAutolinks);
  syncBranchProtection(targetRepo, sourceRepository.default_branch, sourceBranchProtection);
  rewriteTemplateReferences({
    maintainerLogin,
    normalizedRepoName,
  });

  logSuccess("Bootstrap complete.");
}

function parseArguments(arguments_) {
  const options = {};

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument.startsWith("--source=")) {
      options.source = argument.slice("--source=".length);
      continue;
    }

    if (argument === "--source") {
      options.source = arguments_[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--repo=")) {
      options.repo = argument.slice("--repo=".length);
      continue;
    }

    if (argument === "--repo") {
      options.repo = arguments_[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--maintainer=")) {
      options.maintainer = argument.slice("--maintainer=".length);
      continue;
    }

    if (argument === "--maintainer") {
      options.maintainer = arguments_[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function printHelp() {
  process.stdout.write(`Bootstrap a repo created from this template.

Usage:
  npm run bootstrap:repo
  npm run bootstrap:repo -- --repo OWNER/REPO
  npm run bootstrap:repo -- --source OWNER/TEMPLATE --repo OWNER/REPO

Options:
  --repo         Explicit target repository in OWNER/REPO format.
  --source       Template repository to copy GitHub settings from.
  --maintainer   GitHub login to write into local maintainer references.
  --help, -h     Show this message.

Notes:
  - Requires gh auth with admin access to the target repository.
  - If --repo is omitted, the script infers it from the origin remote.
`);
}

function ensureCommand(command) {
  try {
    execFileSync("bash", ["-lc", `command -v ${command}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "ignore",
    });
  } catch {
    throw new Error(`Required command not found: ${command}`);
  }
}

function inferTargetRepo() {
  const remoteUrl = runCommand("git", ["remote", "get-url", "origin"]).trim();
  const parsedRepository = parseRepositoryFromRemoteUrl(remoteUrl);

  if (parsedRepository === null) {
    throw new Error(
      "Could not infer the target repository from origin. Pass --repo OWNER/REPO explicitly.",
    );
  }

  return parsedRepository;
}

function parseRepositoryFromRemoteUrl(remoteUrl) {
  const patterns = [
    /^https:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
    /^git@github\.com:(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
    /^ssh:\/\/git@github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = remoteUrl.match(pattern);

    if (match?.groups?.owner && match.groups.repo) {
      return `${match.groups.owner}/${match.groups.repo}`;
    }
  }

  return null;
}

function getAuthenticatedGitHubLogin() {
  try {
    return ghApiText(["api", "user", "--jq", ".login"]).trim();
  } catch (error) {
    throw new Error(
      [
        "gh authentication is required before bootstrapping.",
        "Run `gh auth login -h github.com` and try again.",
        `Original error: ${error.message}`,
      ].join(" "),
    );
  }
}

function getRepositoryDetails(repository) {
  const output = ghApiText(["api", `repos/${repository}`]);
  return JSON.parse(output);
}

function getBranchProtection(repository, branch) {
  const result = runCommandResult("gh", ["api", `repos/${repository}/branches/${branch}/protection`]);

  if (result.status === 0) {
    return JSON.parse(result.stdout);
  }

  if (isNotFoundResult(result)) {
    return null;
  }

  throw new Error(`Failed to read branch protection for ${repository}:${branch}: ${result.stderr}`);
}

function getAutolinks(repository) {
  const output = ghApiText(["api", `repos/${repository}/autolinks`]);
  return JSON.parse(output);
}

function isFeatureEnabled(endpoint) {
  const result = runCommandResult("gh", ["api", "-i", endpoint]);

  if (result.status === 0) {
    return /^HTTP\/[0-9.]+ (?:200|204)\b/m.test(result.stdout);
  }

  if (isNotFoundResult(result)) {
    return false;
  }

  throw new Error(`Failed to inspect ${endpoint}: ${result.stderr}`);
}

function applyRepositorySettings(targetRepository, sourceRepository) {
  logStep("Applying repository settings");

  const arguments_ = [
    "repo",
    "edit",
    targetRepository,
    "--default-branch",
    sourceRepository.default_branch,
    `--enable-auto-merge=${sourceRepository.allow_auto_merge}`,
    `--enable-discussions=${Boolean(sourceRepository.has_discussions)}`,
    `--enable-issues=${sourceRepository.has_issues}`,
    `--enable-merge-commit=${sourceRepository.allow_merge_commit}`,
    `--enable-projects=${sourceRepository.has_projects}`,
    `--enable-rebase-merge=${sourceRepository.allow_rebase_merge}`,
    `--enable-squash-merge=${sourceRepository.allow_squash_merge}`,
    `--enable-wiki=${sourceRepository.has_wiki}`,
    `--allow-update-branch=${sourceRepository.allow_update_branch}`,
    `--delete-branch-on-merge=${sourceRepository.delete_branch_on_merge}`,
  ];

  runCommand("gh", arguments_);

  const apiPayload = {
    allow_forking: Boolean(sourceRepository.allow_forking),
    web_commit_signoff_required: Boolean(sourceRepository.web_commit_signoff_required),
  };

  ghApiWithBody("PATCH", `repos/${targetRepository}`, apiPayload);
}

function applySecurityFeatures(targetRepository, securityAndAnalysis) {
  if (!securityAndAnalysis || Object.keys(securityAndAnalysis).length === 0) {
    return;
  }

  logStep("Applying code security settings");

  for (const [settingName, settingValue] of Object.entries(securityAndAnalysis)) {
    try {
      ghApiWithBody("PATCH", `repos/${targetRepository}`, {
        security_and_analysis: {
          [settingName]: settingValue,
        },
      });
    } catch (error) {
      logWarn(
        [
          `Could not apply security setting ${settingName}.`,
          "This usually means the target repo plan or permissions do not support that feature.",
          formatError(error),
        ].join(" "),
      );
    }
  }
}

function syncVulnerabilityAlerts(targetRepository, isEnabled) {
  logStep(`${isEnabled ? "Enabling" : "Disabling"} vulnerability alerts`);
  runCommand("gh", [
    "api",
    "-X",
    isEnabled ? "PUT" : "DELETE",
    `repos/${targetRepository}/vulnerability-alerts`,
  ]);
}

function syncAutomatedSecurityFixes(targetRepository, isEnabled) {
  logStep(`${isEnabled ? "Enabling" : "Disabling"} automated security fixes`);
  runCommand("gh", [
    "api",
    "-X",
    isEnabled ? "PUT" : "DELETE",
    `repos/${targetRepository}/automated-security-fixes`,
  ]);
}

function syncLabels(sourceRepository, targetRepository) {
  logStep("Syncing labels");
  runCommand("gh", ["label", "clone", sourceRepository, "--repo", targetRepository, "--force"]);
}

function syncAutolinks(targetRepository, autolinks) {
  if (autolinks.length === 0) {
    logInfo("No autolinks configured in the template repository.");
    return;
  }

  logStep("Syncing autolinks");

  for (const autolink of autolinks) {
    const payload = {
      key_prefix: autolink.key_prefix,
      url_template: autolink.url_template,
      is_alphanumeric: autolink.is_alphanumeric,
    };

    try {
      ghApiWithBody("POST", `repos/${targetRepository}/autolinks`, payload);
    } catch (error) {
      if (String(error.message).includes("already_exists")) {
        continue;
      }

      throw error;
    }
  }
}

function syncBranchProtection(targetRepository, branch, branchProtection) {
  if (branchProtection === null) {
    logInfo(`No branch protection is configured on ${branch} in the template repository.`);
    return;
  }

  logStep(`Syncing branch protection for ${branch}`);

  const pullRequestReviews = branchProtection.required_pull_request_reviews
    ? {
        dismiss_stale_reviews: branchProtection.required_pull_request_reviews.dismiss_stale_reviews,
        require_code_owner_reviews:
          branchProtection.required_pull_request_reviews.require_code_owner_reviews,
        require_last_push_approval:
          branchProtection.required_pull_request_reviews.require_last_push_approval,
        required_approving_review_count:
          branchProtection.required_pull_request_reviews.required_approving_review_count,
        dismissal_restrictions: {
          users: [],
          teams: [],
          apps: [],
        },
        bypass_pull_request_allowances: {
          users: [],
          teams: [],
          apps: [],
        },
      }
    : null;

  const payload = {
    required_status_checks: branchProtection.required_status_checks
      ? {
          strict: branchProtection.required_status_checks.strict,
          contexts: branchProtection.required_status_checks.contexts,
        }
      : null,
    enforce_admins: branchProtection.enforce_admins.enabled,
    required_pull_request_reviews: pullRequestReviews,
    restrictions: null,
    required_linear_history: branchProtection.required_linear_history.enabled,
    allow_force_pushes: branchProtection.allow_force_pushes.enabled,
    allow_deletions: branchProtection.allow_deletions.enabled,
    block_creations: branchProtection.block_creations.enabled,
    required_conversation_resolution: branchProtection.required_conversation_resolution.enabled,
    lock_branch: branchProtection.lock_branch.enabled,
    allow_fork_syncing: branchProtection.allow_fork_syncing.enabled,
  };

  ghApiWithBody("PUT", `repos/${targetRepository}/branches/${branch}/protection`, payload);
}

function rewriteTemplateReferences({ maintainerLogin, normalizedRepoName }) {
  logStep("Updating local template references");

  replaceAllInFile(".github/CODEOWNERS", /@[\w-]+/g, `@${maintainerLogin}`);
  replaceAllInFile(
    "SECURITY.md",
    /https:\/\/github\.com\/[A-Za-z0-9-]+/g,
    `https://github.com/${maintainerLogin}`,
  );
  replaceFirstInFile("package.json", /"name": "[^"]+"/, `"name": "${normalizedRepoName}"`);
  replaceFirstInFile(
    "package-lock.json",
    /^  "name": "[^"]+"/m,
    `"name": "${normalizedRepoName}"`,
  );
  replaceFirstInFile(
    "package-lock.json",
    /^      "name": "[^"]+"/m,
    `"name": "${normalizedRepoName}"`,
  );
  replaceFirstInFile(
    "supabase/config.toml",
    /^project_id = ".*"$/m,
    `project_id = "${normalizedRepoName}"`,
  );
  replaceAllInFile("SECURITY.md", new RegExp(TEMPLATE_USER_LOGIN, "g"), maintainerLogin);
  replaceAllInFile("package.json", new RegExp(TEMPLATE_REPO_NAME, "g"), normalizedRepoName);
  replaceAllInFile("package-lock.json", new RegExp(TEMPLATE_REPO_NAME, "g"), normalizedRepoName);
  replaceAllInFile("supabase/config.toml", new RegExp(TEMPLATE_REPO_NAME, "g"), normalizedRepoName);
}

function replaceFirstInFile(filePath, pattern, replacement) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const updatedContents = fileContents.replace(pattern, replacement);

  if (updatedContents !== fileContents) {
    fs.writeFileSync(filePath, updatedContents);
  }
}

function replaceAllInFile(filePath, pattern, replacement) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const updatedContents = fileContents.replaceAll(pattern, replacement);

  if (updatedContents !== fileContents) {
    fs.writeFileSync(filePath, updatedContents);
  }
}

function normalizeRepositoryName(repositoryName) {
  const normalized = repositoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length === 0) {
    throw new Error(`Could not derive a valid local name from repository ${repositoryName}`);
  }

  return normalized;
}

function ghApiWithBody(method, endpoint, body) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "repo-bootstrap-"));
  const inputPath = path.join(temporaryDirectory, "body.json");

  fs.writeFileSync(inputPath, JSON.stringify(body, null, 2));

  try {
    runCommand("gh", ["api", "-X", method, endpoint, "--input", inputPath]);
  } finally {
    fs.rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

function ghApiText(arguments_) {
  return runCommand("gh", arguments_);
}

function runCommand(command, arguments_) {
  const result = runCommandResult(command, arguments_);

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} exited with status ${result.status}`);
  }

  return result.stdout;
}

function runCommandResult(command, arguments_) {
  const result = spawnSync(command, arguments_, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    status: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout ?? "",
    stderr: result.error?.message ? `${result.stderr ?? ""}\n${result.error.message}`.trim() : result.stderr ?? "",
  };
}

function isNotFoundResult(result) {
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  return /\b404\b/.test(combinedOutput) || /Not Found/i.test(combinedOutput);
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function logStep(message) {
  process.stdout.write(`\n[bootstrap] ${message}\n`);
}

function logInfo(message) {
  process.stdout.write(`[bootstrap] ${message}\n`);
}

function logWarn(message) {
  process.stderr.write(`[bootstrap] Warning: ${message}\n`);
}

function logSuccess(message) {
  process.stdout.write(`[bootstrap] ${message}\n`);
}

main();
