# Rooibos CHANGELOG

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
