# Sprint Issue Tracking

This directory contains file-based issue tracking for the AI Dev Team Simulation sprint workflow.

## Structure

- `issues.json` - All sprint-related issues and their metadata
- Individual sprint directories may be created as needed

## Issue Format

Each issue in `issues.json` contains:

```json
{
  "id": "FAB-XX",
  "identifier": "FAB-XX",
  "title": "Issue Title",
  "description": "Markdown description",
  "status": "open|in_progress|closed",
  "project": "ai-dev-team-simulation",
  "team": "Fabio Vedovelli",
  "createdAt": "ISO-8601 timestamp",
  "comments": [
    {
      "author": "developer-name",
      "body": "comment text",
      "createdAt": "ISO-8601 timestamp"
    }
  ]
}
```

## Status Values

- `open` - Issue created, awaiting work
- `in_progress` - Active development
- `closed` - Completed or resolved

## Note

This is a file-based tracking system used in place of Linear MCP integration.
