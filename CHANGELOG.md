#### 3.3.0 (2019-09-26)

##### Chores

* adds changelog generator to dependencies ([22a25308](https://github.com/georgejecook/rooibos/commit/22a25308cd4d448c4cdd01087dc43cda74ca82d5))

##### New Features

*  Increase mocks limit to 25 - it is now possible to create up to 25 mocks for a given test suite. ([#73](https://github.com/georgejecook/rooibos/pull/73)) ([92369c3c](https://github.com/georgejecook/rooibos/commit/92369c3cc12e38065d6b4faaedf5a5c46995774b))

##### Bug Fixes

*  fixes incorrect reporting of version numbers during test run ([e8208318](https://github.com/georgejecook/rooibos/commit/e820831823993e33a6581926701d8263f7826fc4))

#### 3.2.2 (2019-09-23)

#### 3.2.1 (2019-09-23)

##### Chores

*  add bash task to run gulp, coz vscode ide keeps opening a gulp tab ([c7a45ad2](https://github.com/georgejecook/rooibos/commit/c7a45ad2160fd3c7c31a7ccf692440ad7ec7391b))

##### Bug Fixes

*  fixes regression in node tests ([7b63c69e](https://github.com/georgejecook/rooibos/commit/7b63c69ecacdd26d6d9b067b46eb56908ae869e7))

#### 3.2.0 (2019-09-22)

##### Chores

*  adds documentation for matchers ([ef791711](https://github.com/georgejecook/rooibos/commit/ef791711abe87a02ee5c935aa5ac34f178cdf6e3))

##### New Features

*  adds matchers for mocks, you can now use built in anyXXXMatchers, or roll your own as function pointers, or inline functions ([f87609e5](https://github.com/georgejecook/rooibos/commit/f87609e5c1e0dc0b532333be4d6971755d3af229))
*  migrate to using brighterscript, via maestro project's compiler ([391b902c](https://github.com/georgejecook/rooibos/commit/391b902c82b63a261a73f452879fbde72eb57ae0))

##### Bug Fixes

*  fixes versoin number mismatch errors - the framework now correctly ascertains if it has a version greater than the minimum required version, instead of requiring a direct match ([c6baa2dc](https://github.com/georgejecook/rooibos/commit/c6baa2dc33ef689b49ffc68310bb6f95f0919549))

# Rooibos CHANGELOG

## 3.0.4 - legacy support!

### Added

  - legacy support with rooibosC 3.0.9 or later

### Changed

### Deprecated

### Removed

### Fixed

  - ignored tests are now reported

## 3.0.3 - out of beta - yay!

### Added

  - loads runtime config from a rooibosC generated function which
    - enables fail fast mode
    - enables show only failures mode.

### Changed

### Deprecated

### Removed

  - testConfig.json file - we now use rooibosC flags for everything

### Fixed

  - crash when any function calls asString on an aa that has mocked functions

## 3.0.2-beta

### Added

  - adds path to code coverage

### Changed

### Deprecated

### Removed

### Fixed

## 3.0.1-beta

### Added

  - More documentation for code coverage

### Changed

### Deprecated

### Removed

### Fixed
  - crash on metaTestcase.time

## 3.0.0-beta

### Added

  - Code coverage support!

### Changed

  - there are breaking changes in rooibos-preprocessor which, are required for code coverage. I'm keeping the major versions of rooibos and rooibos-preprocessor in sync, due to documentation, and everyone's sanity

### Deprecated

### Removed

### Fixed
  - #45 - crash when checking an expect param, and one of the params is a mock/stub
  - #40 - can now use / in the params - much better parsing, too

## 2.3.0

### Added

  - prints ms duration of each test in the output

### Changed

### Deprecated

### Removed

### Fixed

## 2.2.0

### Added

  - sets the node property on non-node test suites. This allows you to access the global namespace, in case you are testing mixin methods, or other non-scoped code (i.e. the equivalent of accessing `method` as opposed to `m.method` or `myObject.method`)

### Changed

### Deprecated

### Removed

### Fixed

## 2.1.4

### Added

  - adds new Parameter arg directive #RBSNode, to allow creation of nodes in the parameterized args

### Changed

### Deprecated

### Removed

### Fixed

## 2.1.3

### Added

### Changed

 - improves documentation, explaining how to use rooibos-preprocessor from gulp/js toolchains

### Deprecated

### Removed

### Fixed


## 2.1.2

### Added

### Changed

### Deprecated

### Removed

### Fixed

  - collision on overloaded expect calls that on same method name on different objects
  - https://github.com/georgejecook/rooibos/issues/36

## 2.1.1

### Added

### Changed

### Deprecated

### Removed

### Fixed

  - removes debug logging for fake calls
  - https://github.com/georgejecook/rooibos/issues/25
  - https://github.com/georgejecook/rooibos/issues/30
  - https://github.com/georgejecook/rooibos/issues/29

## 2.1.0 

### Added
  - Multiple overloads for expectOnce, allowing for easy definition of multi params and return values from the same method invocation

### Changed

### Deprecated

### Removed

### Fixed

  - Potential crash when passing wrong type of arg value into a fake

## 2.0.0 

### Added

  - Leverage rooibosC preprocessor
  - Better examples
  - Faster parsing

### Changed

  - Now requires rooibosC to create the test metadata structures

### Deprecated

### Removed

  - Legacy framework support

### Fixed

  - various runtime error scenarios

## 0.2.0 Initial feedback release
 - Compatability with Roku unit test framework
 - Fix issues submitted by initial users
 - Add `'@OnlyParams` tag
 - Add `AssertArrayContainsOnlyValuesOfType` assertion
 - Documentation tweaks
 - Improvements to various assertions
 - Adds more unit testing of assertions
 - Improves test report to show ignored tests
 - Annotations are more flexible, allowing spaces/blank lines and comments between `'@Test`, `'@Only`, `'@Ignore` and function definitions


## 0.1.0 Initial release
 - Core framework
 - Documentation
 - API documentation
 - Build scripts
