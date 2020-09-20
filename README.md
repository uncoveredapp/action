# Uncovered Action

[![Build status](https://github.com/uncoveredapp/action/workflows/CI/badge.svg)](https://github.com/uncoveredapp/action/actions)

A GitHub Action to upload code coverage

## Usage

Create a file in your repo named `.github/workflows/uncovered.yml` with the following contents:

```yml
name: Upload Coverage

on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  upload:
    name: upload
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v2
      - uses: uncoveredapp/action@v1
```

## Settings

| Name              | Description                                | Default  | Required |
| ----------------- | ------------------------------------------ | -------- | -------- |
| coverageDirectory | The location of your code coverage report  | coverage | No       |
| uploadToken       | The repository upload token from Uncovered |          | Yes      |
