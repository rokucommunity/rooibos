#### 4.0.0 (2020-06-12)

This is a BREAKING RELEASE.

You will have to change how you initialize rooibos. In your main.brs, you will now put:

```
  if (type(Rooibos_init) = "Function") then
  'bs:disable-next-line
  if (type(Rooibos_init) = "Function") then Rooibos_init()
  end if
```

refer to the [documentation](file:///home/george/hope/open-source/rooibos/docs/module-rooibos.html#.Rooibos_init) for more info.

#### Chores

* **core:** 
  * Upgrades to use the official brighterscript compiler
  * Better partitions code into namespaces and classes
  * Adds bs:disable-next-line directives to dynamically resovled function calls 

##### Bug Fixes

* **Core:**
  * Fixes several small bugs, including wrong params sent for nodeContains and crashes on lcov reporting and test reporting
  
#### 3.6.1 (2020-05-21)

##### Chores

* **tests:**  Adds node test to framework suite, and also improves the file structure to include placeholder files, so as to better conform with brighterscript compiler ([f23b81d8](https://github.com/georgejecook/rooibos/commit/f23b81d8e34a6e0e86af84dc2441d0755bb5eba2))

##### Bug Fixes

* **TestRunner:**
  *  Do not crash if node tests do not return stat object, and instead provide useful links to documentation to help devs out ([a643df7a](https://github.com/georgejecook/rooibos/commit/a643df7ac3ec2245c972ad05f2adc65441fade22))
  *  Adds more logoutput when a node test does not complete ([c4277d66](https://github.com/georgejecook/rooibos/commit/c4277d66779b7b6c9f77cbc71c74d60e7668dfb1))

#### 3.6.0 (2020-05-21)

##### Chores

* **docs:**  add async assert docs ([6261e551](https://github.com/georgejecook/rooibos/commit/6261e551f1e6a3ad92eef07d2236c203141fa0ec))

##### New Features

* **assertions:**  adds support for async fields ([28f32754](https://github.com/georgejecook/rooibos/commit/28f32754daee7d4adef7a4e18baa0d6af07653f9))

#### 3.5.1 (2020-05-20)

##### Bug Fixes

* **TestRunner:**  Addresses issue that prevented node tests from correctly running ([c6aec599](https://github.com/georgejecook/rooibos/commit/c6aec599edd1e61cf90634a5bf718af1f02560d1))

#### 3.5.0 (2020-05-20)

##### New Features

* **runner:**  adds ability to wait on scene.isReadyToStartTests, if present before starting the tests ([c1b71a9a](https://github.com/georgejecook/rooibos/commit/c1b71a9a6f7b8e4e974ecf33d4928d3b249b2532))

##### Bug Fixes

* **mocks:**  Better handling for mock creation failures ([df74e3b5](https://github.com/georgejecook/rooibos/commit/df74e3b52caf42ae9f8439a92694c7c36a7a827c))

#### 3.4.3 (2020-05-10)

##### Bug Fixes

* **mocks:**  Fixes crash on multi expect ([e02f96ca](https://github.com/georgejecook/rooibos/commit/e02f96cab091fc6a0d622f85b7302d7c48480aca))

#### 3.4.2 (2020-05-07)

##### New Features

* **mocks:** adds shadow methods to facilitate mock failure line number reporting ([d1e652cc](https://github.com/georgejecook/rooibos/commit/d1e652cc9a622b7c3ee7bd86937d5b826ea08dc3))

#### 3.4.1 (2020-05-06)

##### Bug Fixes

* **core:**  minor logger fix ([61ee8113](https://github.com/georgejecook/rooibos/commit/61ee81136a609586c96e553ea49ab7828c7424fa))

#### 3.4.0 (2020-05-05)

##### Chores

*  update version txt ([6066fd0b](https://github.com/georgejecook/rooibos/commit/6066fd0b344c4efc9aa559a8597007d794350d79))

##### New Features

* **core:**  Adds lcov report, and moves test files to brighterscript ([99b8d50a](https://github.com/georgejecook/rooibos/commit/99b8d50a7c0668c0bca29eedfdc190ebe10ff7e7))
*  lcov support ([0cfb9181](https://github.com/georgejecook/rooibos/commit/0cfb91813587fb26a7be1e3f64ad798be2e86b83))
* **runner:**  allows for up to 12 params on parameterized tests ([e9e9dfd7](https://github.com/georgejecook/rooibos/commit/e9e9dfd773abd64116d175e38a11eb731dab3e0a))

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
