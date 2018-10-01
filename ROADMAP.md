# Rooibos roadmap
Up to date as of October 1st, 2018

Current version: 0.2.0

## 0.1.0 Initial release

## 0.2.0 Initial feedback
Fix immediate issues that come back from the first few weeks of release
Also add an `'@OnlyParams[p1,...p6]` tag, so that we don't need to use `@IgnoreParams`

## 0.3.0 Unit tests for the framework
Unit tests will be written which test the following:

 - Assertions
 - Ignore
 - Only
 - Mocks
 - Stubs
 - Expect

## 0.4.0 Integration with [To be named] roku pre-processor
I have another project in the works which pre-processes brightscript and xml to provide an Adobe flex-like syntax for easy MVVM roku development. I want to integrate hooks into that, which will automatically generate node test files.

## 0.5.0 Add additional reporting opptions
Will add the ability to specifiy a unit test reporting class, to faciliate custom unit test reporting
