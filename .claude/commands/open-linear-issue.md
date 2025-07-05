Setup development environment for Linear issue #{issue_number}:

1. FETCH LINEAR ISSUE
   - Retrieve issue details: title, description, acceptance criteria, labels, and status
   - Get the Linear-provided branch name (format: {team-key}-{issue_number}-{slugified-title})
   - Note parent issues, subtasks, and related tickets
   - Capture any comments that contain implementation details

2. ANALYZE & PLAN
   - Review the issue requirements and acceptance criteria
   - Review relevant sections of codebase for situational awareness
   - Break down the work into logical implementation steps
   - Identify potential challenges or areas needing clarification

3. CREATE SCRATCHPAD_{issue_number}.md
   Generate a structured work plan:
   ```
   # {Issue Title} - #{issue_number}
   
   ## Issue Details
   - Linear URL: {issue_url}
   - Status: {current_status}
   - Priority: {priority}
   - Labels: {labels}
   
   ## Description
   {full issue description}
   
   ## Acceptance Criteria
   {acceptance criteria from Linear}
   
   ## Branch Strategy
   - Base branch: develop-ts
   - Feature branch: {linear-branch-name}
   - Current branch: {show current git branch}
   
   ## Precision Implementation Checklist
   - [ ] Setup: Create and checkout feature branch from develop-ts
   - [ ] {First implementation task with clear description}
   - [ ] {Second implementation task}
   - [ ] {Continue breaking down work into atomic commits...}
   - [ ] Testing: {Specific test requirements}
   - [ ] Documentation: Update relevant docs
   - [ ] Final: Self-review and cleanup
   
   ## Technical Notes
   {Any technical considerations or architectural decisions to consider}
   
   ## Questions/Blockers
   {Any unclear requirements or potential blockers}
   ```

4. PREPARE WORKSPACE
   - Create the feature branch from develop-ts (but don't switch to it yet)
   - Display summary: "SCRATCHPAD_{issue_number}.md created. Ready to begin work with '/start-work {issue_number}'"
