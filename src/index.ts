import * as core from '@actions/core';
//const core = require("@actions/core");
import { wait } from './wait';
import { checkStatus } from './status-checker';

async function run(): Promise<void> {
  try {
    //const context: string = core.getInput('check-context')
    //const description: string = core.getInput('check-description')
    
    // To see this output, set the secret `ACTIONS_RUNNER_DEBUG` to true.
    //core.debug(`Checking the ${context} status check.`)
    
    // Wait 60 seconds before checking status check result.
    await wait(60000)
    
    await checkStatus();
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
