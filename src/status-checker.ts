import { debug } from '@actions/core';
import * as github from '@actions/github';
import { wait } from './wait';

export async function checkStatus() {

  const token = process.env['GITHUB_TOKEN'] || null;
  if (token) {
    const octokit = github.getOctokit(token);
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
  
  const { data: pullCommits } = await octokit.repos.listCommits({
    owner: owner,
    repo: repo,
    pull_number: github.context.ref
  });
  
  //const {data: pullCommits} = await octokit.pulls.listCommits({
  //  owner: 'dotnet',
  //  repo: 'docs',
  //  pull_number: 23493
  //});
  
  const sha: string = pullCommits[0].sha;
  
  // Get the completed build status.
  for (let i = 0; i < 360; i+=10) {
  
    const { data: statuses } = await octokit.repos.listCommitStatusesForRef({
      owner: owner,
      repo: repo,
      ref: sha
    });
    
    // Get the most recent status.
    let buildStatus: any;
    for (let status of statuses) {
      if (status.context == 'OpenPublishing.Build') {
        buildStatus = status;
        debug("Found OPS status check.")
        break;
    }

    if (buildStatus != null && buildStatus.state == 'pending')
    {
      // Sleep for 10 seconds.
      await wait(10000);
      debug("State is still pending.");
      continue;
    }
    else
    {
      // Status is no longer pending.
      break;
    }
    
  }
    
    if (buildStatus != null && buildStatus.state == 'success')
    {
      if (buildStatus.description == 'Validation status: warnings')
      {
        // Build has warnings, so add a new commit status with state=failure.
        return await octokit.repos.createCommitStatus({
          owner: owner,
          repo: repo,
          sha: sha,
          state: 'failure',
          context: 'Check for build warnings',
          description: 'Please fix build warnings before merging.',
        })
      }
      else
      {
        debug("OpenPublishing.Build status check did not have warnings.");
        return null;
      }
    }
    else
    {
      // Build status is error, so merging will be blocked.
      // Or, we didn't find the OpenPublishing.Build status check.
      debug("buildStatus is null or buildStatus is not success.");
      return null;
    }
  }
  } else {
    debug("Unable to get the GITHUB_TOKEN from the environment.");
  }
}
