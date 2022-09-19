<p align="center">
  <img src="./images/logo.png" alt="Rooibos test framework" width="200" height="200"/>
</p>
<h3 align="center">
Simple, mocha-inspired, flexible, fun Brightscript test framework for ROKU apps
</h3>


## FEATURES
 - [Easy to integrate](#easy-to-integrate)
 - [Working with tests](/docs/Working-with-tests.md)
 - [Simple, annotation-based, syntax for writing tests](/docs/Creating-test-suites.md#simple-syntax-for-writing-tests)
 - [No need for special file names, or method names](/docs/Creating-test-suites.md#no-need-for-special-file-or-method-names)
 - [Common TDD methods such as Setup/TearDown/BeforeEach/AfterEach](/docs/Creating-test-suites.md#common-tdd-methods)
 - [Organize tests by suites, groups and cases](/docs/Creating-test-suites.md#organize-tests-by-suites-groups-and-cases)
 - [Readable test output](/docs/Understanding-test-output.md)
 - [Easily control test execution](/docs/Controlling-which-tests-run.md#easily-control-test-execution)
 - [Simple assert syntax](/docs/Writing-tests.md#simple-assert-syntax)
 - [Node specific assertions](/docs/Writing-tests.md#node-specific-assertions)
 - [Parameterized testing](/docs/Writing-tests.md#parameterized-testing)
 - [Advanced Setup](/docs/Advanced-Setup.md)
 - [Mocks and stubs](/docs/Mocks-and-stubs.md#mocks-and-stubs)
 - [Mocks node](#mocks-node)
 - [Execute tests on scenegraph nodes](#execute-tests-on-scenegraph-nodes)
 - [Incorporate your own util methods](#incorporate-your-own-util-methods)
 - [Hook into your global setup mechanisms](#hook-into-your-global-setup-mechanisms)
 - [Only show output for failed tests](/docs/Controlling-which-tests-run.md#only-show-output-for-failed-tests)
 - [Easily integrate into any CI system](/docs/Integrating-with-your-CI.md#easily-integrate-into-any-ci-system)
 - [Generate code coverage](/docs/Code-coverage.md#generate-code-coverage)
 - [Backward compatibility](/docs/Backward-compatibility.md)
 - [API reference](https://georgejecook.github.io/rooibos)

<a name="getting-started"></a>
## Getting started
Rooibos is a brighterscript compiler and Visual Studio Extension plugin. That does not mean you need to write in brighterscript; the bsc compiler also parses regular brightscript projects.

The advantages of this are:

 - you get warnings and errors for your tests as you write them in the ide.
 - you do not have to install any thing in your projects, or maintain the rooibos libraries; it just works
 - it is very easy to integrate into your CI toolchain.

## Your project MUST use Vscode and the brighterscript compiler

Rooibos will not work if you do not use the brighterscript compiler. I have no plans to support any other toolchains.

## You MUST configure vscode ide to use your project's version of bsc compiler

Either click the select brighterscript button in the bottom right, or add this setting to your `.vscode/settings.json` file:

```
"brightscript.bsdk": "node_modules/brighterscript"
```

## Installation
<a name="easy-to-integrate"></a>

### I do not have a project that uses the brighterscript transpiler

You will need to setup a bsc project to use rooibos 4. Here is an [example project](https://github.com/georgejecook/rooibos-roku-sample) you can clone.

The easiest thing to do is to clone that project and
 - copy bsconfig.json
 - merge the contents of the files in .vscode folder
 - merge the contents of package.json into your project

You can do the setup from scratch as followes:

1. Ensure your project is set up for use with npm (`npm init`, and follow the steps)
2. Install brighterscript: `npm install brighterscript --save-dev`
3. Install rooibos roku: `npm install rooibos-roku --save-dev`
4. Add a script to your package.json, e.g.
```
  "scripts": {
    "build-tests": "npx bsc"
  }
```
5. Add a bsconfig.json file. The easiest thing to do is copy the file from the [example project](https://github.com/georgejecook/rooibos-roku-sample)
6. Setup a task to run `npm run build-tests`, in `.vscode/tasks.json`
7. Setup a launch task to run the build-tests task, from the previous step, in `.vscode/launch.json`
8. Create some tests

### I already have a project using brighterscript
1. ensure you have a bsconfig.json, as per: https://github.com/rokucommunity/brighterscript
2. `npm install rooibos-roku --save-dev`
3. Add the rooibos plugin to your `bsconfig.json` file as follows:

```
  "plugins": [
    "rooibos-roku"
  ]
```

Rooibos will automatically inject the necessary source files into your project, at build time, and inject the hooks to run.

Note - you will likely use a seprate `bsconfig.json` file for your tests, e.g. `bsconfig-test.json`, which will be used by your CI/testing vscode launch target.

#### Delaying start so you can set things up - CURRENTLY UNSUPPORTED

If you need to do some setup, like load some data from a service, before starting your tests:

 - add a field `isReadyToStartTests` to your tests scene
 - set the value to true, when the tests are ready to start.

 NOTE: this is not yet supported in rooibos 4! I will add it again soon.

### Configuring Rooibos's runtime behaviour

Rooibos's configuration is controlled via the configuration passed into the `bsconfig.json` via flags on the `rooibos` json blob

e.g.

```
  "rooibos": {
    "isRecordingCodeCoverage": false,
    "printTestTimes": true,
    "testsFilePattern": null,
    "tags": ["!integration", "!deprecated", "!fixme"],
    "showOnlyFailures": true,
    "catchCrashes": true,
    "lineWidth": 70
  },
  ```

The following options are supported:

- logLevel?: RooibosLogLevel - 0-4 (error, warn, info, debug)
- showOnlyFailures?: boolean - if true, then only failed tests are shown; but everything is show if no failures occurred
- printTestTimes?: boolean - if true then the time each test took is output
- lineWidth?: number - width of test output lines in columns
- catchCrashes? : boolean - if true, then any crashes will report CRASH statement, and note halt test execuction - very useful for running a whole suite
- sendHomeOnFinish? : boolean - if true, then the app will exit upon finish. The default is true. Useful to set to false for local test suites.
- testsFilePattern?: string - the pattern to use to find tests, this is a glob, the default is "**/*.spec.bs"
- tags?: string[] - the tags listed here control what is run - you can use !tagname to indicated any tests/suites that are skipped, all other tags are ANDed. This is very useful for having a bsconfig to run, say tests including long, and slow integration tests, or just running a certain subset of your suite.


