# Run Workflows from Terminal

## Smoke test
/workflow run engine/workflows/examples/transform_only.workflow.json

## With input
/workflow run engine/workflows/examples/slack_ai_summary.workflow.json --input engine/workflows/examples/sample.input.json

## Inspect
/workflow list
/workflow show <runId>