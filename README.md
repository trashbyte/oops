# oops

This action automatically deletes the previous workflow run results if a push occurs when the latest commit was `--amend`ed. Ever bring an entire workflow to a screeching halt over a single typo? Just `--amend` it and the broken results are deleted automatically.

Note: this works by comparing commit messages and checking if the last two on the given branch are the same. Therefore, amends with altered messages will not be processed and unique commits with identical messages will be!

## Inputs
### 1. `token`
#### Required: YES
The token used to authenticate.
* If the workflow runs are in the current repository where the action is running, you can use `${{ github.token }}`.
* If the workflow runs are in another repository, you need to use a personal access token that must have the `repo` scope.

### 2. `repository`
#### Required: YES
The name of the repository to check, in the format "{user}/{repo}"
* As with `token`, you can use `${{ github.repository }}` if the action is running in the target repository.

### 3. `branch`
#### Required: NO
The name of the branch to check. Default is `master`.

### Example
```yaml
name: Clean `--amend`ed run results
on: [push]
jobs:
  clean_amend:
    runs-on: ubuntu-latest
    steps:
      - name: Clean `--amend`ed run results
        uses: trashbyte/oops@master
        with:
          token: ${{ github.token }}
          repository: ${{ github.repository }}
          branch: some-branch
```
