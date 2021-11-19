async function run() {
  const core = require("@actions/core");
  try {
    const token = core.getInput('token')
    const repo = core.getInput('repository')
    const branch = core.getInput('branch')
    if (!token || !repo || !branch) {
      core.setFailed("Missing a required parameter. `token`, `repository`, and `branch` are required.")
      return
    }

    const split = repo.split('/')
    if (split.length !== 2 || !split[0] || !split[1]) {
      throw new Error(`Invalid repository '${repo}'. Expected format {owner}/{repo}.`)
    }
    const [repo_owner, repo_name] = split
    
    const { Octokit } = require("@octokit/rest")
    const octokit = new Octokit({ auth: token })

    let messages = []
    let previous_sha = ""
    const response = await octokit.request("GET /repos/{owner}/{repo}/events", { owner: repo_owner, repo: repo_name })
    for (datum of response.data.filter(d => d.type === "PushEvent" && d.payload.commits && d.payload.commits.length > 0 && d.payload.ref === ("refs/heads/"+branch))) {
      for (commit of datum.payload.commits) {
        if (messages.length === 1 && previous_sha.length === 0) {
          // save second sha
          previous_sha = commit.sha
        }
        messages.push(commit.message)
        if (messages.length === 2) { break }
      }
      if (messages.length === 2) { break }
    }
    if (messages.length < 2) {
      console.log("Less than 2 commits in this branch's history, not doing anything.")
      return
    }
    if (messages[0] === undefined || messages[1] === undefined) {
      core.setFailed("Couldn't get a commit message on one of the last two commits on this branch.")
      return
    }
    if (messages[0] != messages[1]) {
      console.log("Last two commit messages don't match, not doing anything.")
      console.log("msg1: " + messages[0])
      console.log("msg2: " + messages[1])
      return
    }
    else {
      let run_id = null;
      const response2 = await octokit.actions.listWorkflowRunsForRepo({ owner: repo_owner, repo: repo_name });
      for (run of response2.data.workflow_runs) {
        if (run.head_sha === previous_sha) {
          run_id = run.id
          break
        }
      }
      if (run_id === null) {
        core.setFailed("Couldn't find a workflow run for commit with sha " + previous_sha)
        return
      }
      console.log(`Deleting run for commit '${previous_sha}' with id '${run_id}'`)
      await octokit.actions.deleteWorkflowRun({
        owner: repo_owner,
        repo: repo_name,
        run_id: run_id
      });
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
