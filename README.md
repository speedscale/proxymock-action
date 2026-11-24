# proxymock replay action

Replay recorded traffic against your service on every pull request, with its dependencies mocked from the same recording, and fail the job when the service stops answering the way it did.

The action installs [proxymock](https://proxymock.io), starts `proxymock mock` for the service's outbound calls, starts your service, replays the recording against it, and comments on the pull request with the result. The replay also writes a JUnit report and a job summary, and the results are kept as a workflow artifact.

## Usage

Record your service's traffic with `proxymock record` and commit the recording, then add a workflow:

```yaml
name: proxymock

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  replay:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Build your service here.

      - uses: speedscale/proxymock-action@v1
        with:
          api-key: ${{ secrets.SPEEDSCALE_API_KEY }}
          app-command: ./start-your-service
          app-port: 8080
```

Add your proxymock API key as the repository secret `SPEEDSCALE_API_KEY`. `proxymock ci init github` writes this workflow for you.

## What fails the job

The built-in `regression` test config fails the job when a request's status code changed, and on the goals the config sets. A response body that changed is reported but does not fail the job by default. Add a gate to fail on it too:

```yaml
      - uses: speedscale/proxymock-action@v1
        with:
          api-key: ${{ secrets.SPEEDSCALE_API_KEY }}
          app-command: ./start-your-service
          fail-if: |
            requests.response-match-pct < 100
            latency.p95 > 250
```

Each line of `fail-if` is one `proxymock replay --fail-if` condition. Fields that change on every run, such as ids and timestamps, are not counted as changes. See [Replay verdicts](https://docs.speedscale.com/proxymock/guides/replay-verdicts/) for how a response is compared.

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `api-key` | required | Your proxymock API key. |
| `in` | `proxymock` | Recorded traffic to replay and to answer the dependencies from: the proxymock workspace by default, whose results are left out. |
| `app-command` | | Command that starts your service. Leave empty to replay against a service already running at `test-against`. |
| `app-port` | `8080` | Port your service listens on. |
| `test-against` | `localhost:<app-port>` | Address to replay against. |
| `mock` | `true` | Answer the service's outbound calls from the recording. |
| `test-config` | `regression` | Test config to replay with. |
| `fail-if` | | More gates, one per line. |
| `out` | `proxymock/results/ci` | Directory the replay writes its results to. |
| `junit` | `proxymock-junit.xml` | JUnit report to write. |
| `comment` | `true` | Comment on the pull request with the result. |
| `github-token` | `github.token` | Token the comment is posted with. |
| `webhook-url` | | Slack incoming webhook or JSON webhook to post a failed result to. |
| `upload-artifact` | `true` | Keep the results, the JUnit report and the logs as an artifact. |
| `artifact-name` | `proxymock-replay` | Name of that artifact. |
| `version` | latest | proxymock version to install, such as `v2.5.1476`. |
| `working-directory` | `.` | Directory to run in. |

## Outputs

| Output | Description |
| --- | --- |
| `result` | `passed` or `failed`. |
| `exit-code` | `proxymock replay`'s exit code. |
| `summary` | Path of `replay-summary.md`. |
| `summary-json` | Path of `replay-summary.json`, with each failure's stable key and likely cause. |
| `junit` | Path of the JUnit report. |

## Pull requests from forks

A pull request from a fork runs with a read-only token, so the action cannot comment on it. The comment step is skipped with a warning and the job still reports the replay's result. The result is also in the job summary and the artifact.

## Each failure, explained

The results directory holds a failure bundle for each failed request, with the recorded and replayed exchange, the calls the service made to its dependencies while it handled the request, the likely cause and a prompt for a coding agent. See [Failure bundles](https://docs.speedscale.com/proxymock/guides/replay-verdicts/#failure-bundles).

## Versions

Pin `@v1` for the latest compatible release, or a full tag such as `@v1.0.0`. The action installs the latest proxymock unless `version` names one.

## License

MIT
