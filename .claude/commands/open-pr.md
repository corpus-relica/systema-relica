Create a pull request from the current branch to {target_branch|default:main} with:

Title: Generate a concise, descriptive title based on the changes in this branch

Description:
## Summary
Analyze the commits and changes in this branch and write a clear summary explaining:
- What problem this PR solves
- The approach taken
- Impact of the changes

## Changes Made
List the key changes by:
- Examining the git diff
- Grouping related changes logically
- Highlighting any breaking changes or new features

## Testing
Describe any tests that were added or modified, and suggest additional testing if needed

## Related Issues
Search commit messages and branch name for issue references (#XXX) and link them appropriately

## Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated as needed
- [ ] Documentation updated if applicable
- [ ] Ready for review

Automatically:
- Detect appropriate labels based on the changes (bug fix, feature, docs, etc.)
- Suggest relevant reviewers based on CODEOWNERS or recent file history
- Set as draft if commits contain "WIP" or branch name includes "draft"

