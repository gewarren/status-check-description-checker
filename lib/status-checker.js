"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStatus = void 0;
const core_1 = require("@actions/core");
const github = require("@actions/github");
const wait_1 = require("./wait");
function checkStatus(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = github.getOctokit(token);
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        //console.log('context.ref is: ${github.context.ref}');
        //const { data: pullCommits } = await octokit.repos.listCommits({
        //  owner: owner,
        //  repo: repo,
        //  pull_number: github.context.ref
        //});
        //const sha: string = pullCommits[0].sha;
        const sha = process.env['GITHUB_SHA'] || null;
        if (sha) {
            // Get the completed build status.
            for (let i = 0; i < 360; i += 10) {
                const { data: statuses } = yield octokit.repos.listCommitStatusesForRef({
                    owner: owner,
                    repo: repo,
                    ref: sha
                });
                // Get the most recent status.
                let buildStatus;
                for (let status of statuses) {
                    if (status.context == 'OpenPublishing.Build') {
                        buildStatus = status;
                        core_1.debug("Found OPS status check.");
                        break;
                    }
                    if (buildStatus != null && buildStatus.state == 'pending') {
                        // Sleep for 10 seconds.
                        yield wait_1.wait(10000);
                        core_1.debug("State is still pending.");
                        continue;
                    }
                    else {
                        // Status is no longer pending.
                        break;
                    }
                }
                if (buildStatus != null && buildStatus.state == 'success') {
                    if (buildStatus.description == 'Validation status: warnings') {
                        // Build has warnings, so add a new commit status with state=failure.
                        return yield octokit.repos.createCommitStatus({
                            owner: owner,
                            repo: repo,
                            sha: sha,
                            state: 'failure',
                            context: 'Check for build warnings',
                            description: 'Please fix build warnings before merging.',
                        });
                    }
                    else {
                        console.log("OpenPublishing.Build status check did not have warnings.");
                        return null;
                    }
                }
                else {
                    // Build status is error, so merging will be blocked.
                    // Or, we didn't find the OpenPublishing.Build status check.
                    if (buildStatus == null)
                        console.log("Could not find the OpenPublishing.Build status check.");
                    else
                        console.log("OpenPublishing.Build status is either failure or error.");
                    return null;
                }
            }
        }
        else {
            console.log("Unable to get GITHUB_SHA from the environment.");
        }
    });
}
exports.checkStatus = checkStatus;
