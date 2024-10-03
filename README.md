<p align="center">
  <img src="images/logo.png" alt="Rooibos test framework" width="200" height="200"/>
</p>
<h3 align="center">
Simple, mocha and junit inspired, flexible, and fun Brightscript test framework for Roku apps
</h3>
<p align="center">
  <img src="images/exampleImage.png" alt="Mocha test framework" />
</p>

[![build status](https://img.shields.io/github/actions/workflow/status/rokucommunity/rooibos/build.yml?branch=master&logo=github)](https://github.com/rokucommunity/rooibos/actions?query=branch%3Amaster+workflow%3Abuild)
[![coverage status](https://img.shields.io/coveralls/github/rokucommunity/rooibos?logo=coveralls)](https://coveralls.io/github/rokucommunity/rooibos?branch=master)
[![monthly downloads](https://img.shields.io/npm/dm/rooibos-roku.svg?sanitize=true&logo=npm&logoColor=)](https://npmcharts.com/compare/rooibos-roku?minimal=true)
[![npm version](https://img.shields.io/npm/v/rooibos-roku.svg?logo=npm)](https://www.npmjs.com/package/rooibos-roku)
[![license](https://img.shields.io/npm/l/rooibos-roku.svg)](LICENSE)
[![Slack](https://img.shields.io/badge/Slack-RokuCommunity-4A154B?logo=slack)](https://join.slack.com/t/rokudevelopers/shared_invite/zt-4vw7rg6v-NH46oY7hTktpRIBM_zGvwA)

## Links

- [Documentation](https://github.com/rokucommunity/rooibos/blob/master/docs/index.md)
- [API Documentation](https://rokucommunity.github.io/rooibos)
- [CHANGELOG](CHANGELOG.md)
- [VSCode snippets](docs/vsCodeSnippets.md)
- [Roku Developers slack](https://join.slack.com/t/rokudevelopers/shared_invite/zt-4vw7rg6v-NH46oY7hTktpRIBM_zGvwA)

## Development

Rooibos is an independent open-source project maintained exclusively by volunteers.

You might want to help! Get in touch via the [slack group](https://join.slack.com/t/rokudevelopers/shared_invite/zt-4vw7rg6v-NH46oY7hTktpRIBM_zGvwA) or [raise issues](https://github.com/rokucommunity/rooibos/issues/new).

### Project Setup

1. Clone the project
2. Run `npm install`
3. Open the workspace file in VSCode: `roobois.code-workspace`

### Running Tests

Rooibos Brighterscript plugin tests can be run either through VSCode's debug configuration `Run Tests (bsc-plugin)` or by running `npm run test` in the directory `rooibos/bsc-plugin`.

Example Rooibos framework tests will wrun on a Roku device.

Create a `.env` in `rooibos/tests` with the following details:

```
ROKU_HOST=<ip of Roku device>
ROKU_PASSWORD=<development password of Roku device>
```

Run tests either from a VSCode debugger, or through `npm run test`.

## Sample project

https://github.com/rokucommunity/rooibos-roku-sample

## Quick start

https://github.com/rokucommunity/rooibos/blob/master/docs/index.md#getting-started

## FAQ

### Is Rooibos ready for production use?

Yes, it's been used in production by quite a few respectable companies. There are 10,000's of tests in production.

### Is Rooibos actively maintained?

We at RokuCommunity love rooibos, and regularly keep it up to date.
