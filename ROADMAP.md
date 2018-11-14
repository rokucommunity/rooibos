# Rooibos roadmap

Up to date as of October 1st, 2018

Current version: 0.2.0 and 0.3.0(beta) on evalErradication branch

## 0.1.0 Initial release

## 0.2.0 Initial feedback

Fix immediate issues that come back from the first few weeks of release
Also add an `'@OnlyParams[p1,...p6]` tag, so that we 
don't need to use `@IgnoreParams`

## 0.3.0 rooibosC (beta) - remove eval from rooibos

eval is no longer supported by roku. I don't want rooibos to lose it's accesible annotation style test writing. I've therefore created a preprocessor (named rooibosC) which creates a rooibos.function.map.brs.

## 0.3.1 rooibosC fixes
will address problems current rooibos users face while migrating to rooibosC


## 0.3.5 Unit tests for the framework

Unit tests will be written which test the following:

 - Assertions
 - Ignore
 - Only
 - Mocks
 - Stubs
 - Expect

## 0.4.0 Move ALL test parsing to rooibosC

It's so much quicker to parse in js, that I will rewrite the core parser, to spit out prebaked json, which can be loaded at runtime, to greatly increase rooibos's performance.

## 0.5.0 Add additional reporting opptions

Will add the ability to specifiy a unit test reporting class, to faciliate custom unit test reporting

## 0.6.0 Integration with [To be named] roku pre-processor

I have another project in the works which pre-processes brightscript and xml to provide an Adobe flex-like syntax for easy MVVM roku development. I want to integrate hooks into that, which will automatically generate node test files.

