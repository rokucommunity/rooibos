<p align="center">
  <img src="../images/logo.png" alt="Mocha test framework" width="200" height="200"/>
</p>
<h3 align="center">
Simple, mocha-inspired, flexible, fun Brightscript test framework for ROKU apps
</h3>


## FEATURES
 - [Easy to integrate](#easy-to-integrate)
 - [Simple, annotation-based, syntax for writing tests](#simple-syntax-for-writing-tests)
 - [No need for special file names, or method names](#no-need-for-special-file-or-method-names)
 - [Common TDD methods such as Setup/TearDown/BeforeEach/AfterEach](#common-tdd-methods)
 - [Organize tests by suites, groups and cases](#organize-tests-by-suites-groups-and-cases)
 - [Readable test output](#readable-test-output)
 - [Easily control test execution](#easily-control-test-execution)
 - [Simple assert syntax](#simple-assert-syntax)
 - [Node specific assertions](#node-specific-assertions)
 - [Parameterized testing](#parameterized-testing)
 - [Mocks and stubs](#mocks-and-stubs)
 - [Execute tests on scenegraph nodes](#execute-tests-on-scenegraph-nodes)
 - [Incorporate your own util methods](#incorporate-your-own-util-methods)
 - [Hook into your global setup mechanisms](#hook-into-your-global-setup-mechanisms)
 - [Only show output for failed tests](#only-show-output-for-failed-tests)
 - [Easily integrate into any CI system](#easily-integrate-into-any-ci-system)


## TABLE OF CONTENTS
 - [Getting started](#getting-started)
 - [Creating test suites](#creating-test-suites)
 - [Writing tests](#writing-tests)
 - [Understanding test output](#understanding-test-output)
 - [Controlling which tests run](#controlling-which-tests-run)
 - [Integrating with your app setup and util methods](#integrating-with-your-app-and-utils)
 - [Using mocks and stubs](#using-mocks-and-stubs)
 - [API reference](../docs/apiDocs/index.html)
 - [Assertion reference](../docs/apiDocs/module-BaseTestSuite.html)
 - [Integrating with your CI](#integrating-with-your-ci)
 - [Advanced Setup](#advanced-setup)


## Getting started
Rooibos is intentionally simple to work with. You simply copy in the `rooibos.cat.brs` file, setup your config, and start writing tests

 
### Installation

1. Copy `dist/rooibos.cat.brs` to your `source` folder
2. Add the following line to your main method, in your `main.brs` file It should be placed before you initialize your scenegraph screens 

	```    
	if (type(Rooibos__Init) = "Function") then Rooibos__Init(args)
	```
3. Create an empty Scene named `TestsScene.xml`, in your `components` folder, which Rooibos will use when running tests
4. Create `.brs` test files within your `tests` folder, which corresponds to the `testsDirectory` config setting (default is "pkg:/source/Tests"). Test files can (and are encouraged to) be stored in nested folders, to match your source/component folder hiearchy

### Configuring Rooibos
Rooibos's configuration is controlled via a json config file. The default location for this file is `pkg:/source/Tests/testconfig.json`. If the file is not found, then it is created with default values.

An example config file looks like this:

```
{
	"logLevel": 1,
	"testsDirectory": "pkg:/source/Tests",
	"testFilePrefix": "Test__",
	"failFast": false,
	"showOnlyFailures": false,
	"maxLinesWithoutSuiteDirective": 100
}
```

Each of these args can also be overridden, by passing them as query params when launching the tests. The default location of the `testconfig.json` file can also be set by passing the query argument `testConfigPath`

e.g. you may have a run target in your `Makefile` to display only failed unit tests, as such:

```
testFailures:
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&showOnlyFailures=true&logLevel=4"
```

## Creating test suites
Rooibos has a hiearchy of tests as follows:

 - TestSuite
	 - It Group
		 - TestCase
			 - Parameterized TestCase

A file is considered a test suite if it contains a `@TestSuite` annotation. No special naming is required.

### Simple example
The following is a minimum working example of a Rooibos TestSuite, named `Simple.brs`

```
'@TestSuite [Simp] Simple Tests

'@Setup
function Simp_SetUp() as void
    m.modelLocator = m.testUtils.GetStubModelLocator()
    m.vm = BVM_CreateVM("testVM", m.modelLocator)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests initializaiton of vm
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test can instantiate with invalid modelLocator
function Simp_Init_invalid() as void
    m.vm = BVM_CreateVM("testVM", invalid)
    m.AssertNotInvalid(m.vm)
end function
```

#### Simple example Notes

1. The `++++++++++++`'s around the `@It` declaration are not required; but I find it makes the file much easier to read, and recommend it (or something similar, such as `'*****` as a best practice.
2. In the above example, `Simp` is the namespace, used to stop collisions between our tests and/or other source files


This results in the following test output:

![Simple test output](/Users/georgecook/Documents/h7ci/hope/rooibos/docs/images/simpleReportOutput.png)

Note the hierarchical display of the Testsuite _[Simp] Simple Tests_, the group _tests initialization of vm_ and the test itself _can instantiate with invalid modelLocator_. 

### Rooibos annotations
Rooibos provides a library of annotations which can be used to define TestSuides, It groups, Test Cases, Parameterized tests, and more. All annotations are of the following form

```
'@ANNOTATION DATA
```

Where `ANNOTATION`, is the roku annotation and DATA is the data passed to it. e.g. `'@Test that it handles an empty collection`, defines a test case, with the title `that it handles an empty collection` 

Some annotations act as modifiers. In these cases, they will affect some other annotation. For example `@Only`, and `@Ignore` will affect the following `@TestSuite`, `@It` or `@Test` annotation.

The following annotations are supported.

|Annotation   	|Description   	|Data   |
|---	|---	|---	|
|@TestSuite   	|Indicates a file is a test suite   	|Name of the test suite. Used in test output   	|
|@Setup   	|Run once when the suite is executed	|   	|
|@TearDown   	|Run once when the suite is finished	|   	|
|@BeforeEach   	|Run before each test. Can be specified for the `@TestSuite`, or for each `@It` group	|   	|
|@AfterEach   	|Run after each test. Can be specified for the `@TestSuite`, or for each `@It` group	|   	|
|@It   	|Indicates a group of tests. Groupings improve readability. A group might denote various tests for a given method, or even an aspect of functionality	|Name of the it group, which is used in the test output   	|
|@Test   	|Indicates a `TestCase`. Must directly precede a function definition	|The name of the test acse, which will be reported in the test output   	|
|@Only   	|Precedes a TestSuite, It group, or TestCase, to indicate that _only that item_ should be executed. This can be used to rapidly filter out tests. Only other `@Only` items will be run.	|   	|
|@Ignore   	|Preceds a TestSuite, It group or TestCase, to indicate that that item should be ignored. If an `@Ignore` tag is found before an item, then it will not be executed as part of the test run	|   	|
|@Params[p1,p2,...,p6]   	|Indicates a Paremeterized test. Must come _after_ a `@Test` annotation. Can accept up to 6 arguments, which are comma separated. When using paremeterized tests, the test function signature _must_ accept the same number of arguments, and each of Params statemens, must also have the same number of params	|Up to 6 arguments can be any valid brightscript code, which can be parsed with an `eval` function  	|
|@IgnoreParams[p1,p2,...,p6]   	|A Convenience tag, which makes it easy to temporarily _comment out_ params tests we do not want to run. 	|As per `@Params`   	|


## Writing tests
Rooibos tests must be placed within a group, which in turn must be placed inside a TestSuite.

Tests then comprise assertions, which can test if values are equal, like (using fuzzy logic), contain values, etc.

An assertion looks like this:

```
m.AssertTrue(myValue)
```

A (contrived) test, might look like this:

```
'@Test can instantiate with invalid modelLocator
function Simpl_Basic_true() as void
    myValue = false
    m.AssertTrue(myValue)
end function
```

In this case, the test will fail

![Simple test output](/Users/georgecook/Documents/h7ci/hope/rooibos/docs/images/simpleFail.png)

Observe how the test output indicates in which file the test suite resides, and the line of the failed assert, plus the reason for the failure. If your IDE has integrated brightscript support, such as eclipse, you will find that the locations are clickable. In this example, clicking on the Location link will navigate the IDE to the exact line of code of the assertion.

### Laying out tests
I suggest the following layout when writing your tests

```
'@Test that the correct index is found
function Simpl_DataStore_index() as void
	'1. setup your test data objects and values
	values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	ds = CreateDataStore(values)
	
	'2. Execute the method you wish to test
	item = ds.GetDataItemWithIndex(55)
	
	'3. Do your assertions
	m.AssertNotInvald(item)
	m.AssertEqual(item.name,"twelve")
end function
```

So the final test would look like:

```
'@Test that the correct index is found
function Simpl_DataStore_index() as void
	values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	ds = CreateDataStore(values)
	
	item = ds.GetDataItemWithIndex(12)
	
	m.AssertNotInvald(item)
	m.AssertEqual(item.name,"twelve")
end function
```

### More Assertions
The previous example can be written more succinctly using Rooibos's library of assertions

```
'@Test that the correct index is found
function Simpl_DataStore_index() as void
	values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	ds = CreateDataStore(values)
	
	item = ds.GetDataItemWithIndex(12)
	
	m.AssertAAContainsSubset(item, values[2])
end function
```


### Setting up and tearing down
You may find that you have data which is common to all of your tests in a suite. In this case you can desginate functions to run, before and after **all** tests are executed in your suite. To achieve this, simply add a `'@Setup` or `'@TearDown` annotation before the appropriate method. In our example above, we could do the following:

```
'@Setup
function Simpl_Setup() as void
	m.values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	m.ds = CreateDataStore(m.values)
end function

'@Test that the correct index is found
function Simpl_DataStore_index() as void
	item = m.ds.GetDataItemWithIndex(12)
	
	m.AssertAAContainsSubset(item, m.values[2])
end function
```

### Setup and TeardDown Scoping
Setup and Teardown, can also be scoped to an it group. If the annotations appear _after_ an `'@It` group annotation, then the setup and teardown will apply only to that group. If the annotations appear _before the first it group annotation_ then they will be applied to all groups, _which do not have Setup and Teardown group-level-annotations_


### Using BeforeEach and AfterEach
In addition, we can also use beforeEach and afterEach to run before **each and every** test. 

```
'@Setup
function Simpl_Setup() as void
	m.values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	m.ds = CreateDataStore(m.values)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests alternate data
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function MST_OnConfigLoaded_BeforeEach() as void
	m.alternateValues = [{index:2,name:"two"},{index:3, name:"three"},{index:20, name:"twenty"}]
	m.alternateDS = CreateDataStore(m.alternateValues)
end function

'@Test that the correct index is NOT found
function Simpl_Datastore_alternate_failures() as void
	item = m.alternateDS.GetDataItemWithIndex(12)
	
	m.AssertInvalid(item)
end function


'@Test that the correct index is found
function Simpl_Datastore_alternate_success() as void
	item = m.alternateDS.GetDataItemWithIndex(3)
	
	m.AssertAAContainsSubset(item, m.alternateValues[1])
end function

```

Note that in the example above, each of the tests in the `tests alternate data` group, can be run with different values; but we do not need to set the up in each test, or mutate the values used by other tests, which were defined in the `Setup` method.

#### BeforeEach and AfterEach Scoping
BeforeEach and AfterEach, can also be scoped to an it group. If the annotations appear _after_ an `'@It` group annotation, then they will only apply to that group. If the annotations appear _before the first it group annotation_ then they will be applied to all groups, _which do not have BeforeEach and AfterEach group-level-annotations_

### Paremeterized tests

### Node specficic asserts

### Full list of asserts
The full list of asserts can be found in the documentation  - [Assertion reference](../docs/apiDocs/module-BaseTestSuite.html)

## Understanding test output
Rooibos reports test output in an easy to read hiearhchical manner.

Each test suite has it's own tree structure in the output, and in turn has branches for each group, then each testcase that was run.

### Success and Failure output
When a test passes, it is indicated by the presence of `Success` at the end of the line

![Simple test output](/Users/georgecook/Documents/h7ci/hope/rooibos/docs/images/simpleReportOutput.png)


When a test fails, it is indicated by a `-` in the trunk of the test output, and `Fail`, at the end of the line. In addition, failed tests contain a link to the line of the failed assertion, and the reason for the failure.

![Simple test output](/Users/georgecook/Documents/h7ci/hope/rooibos/docs/images/simpleFail.png)

### End of test report

At the end of the test report, you will get a report telling you how many tests ran, failed, crashed, and the time spent.

In addition, you get a simple to parse result as the last line of output, which makes it easy for you to ascertain the result for your Continuous Integration process.

![Simple test output](/Users/georgecook/Documents/h7ci/hope/rooibos/docs/images/endOfTest.png)

## Controlling which tests run
Rooibos is built to facilitate TDD, and other test-based developer workflows. For this reason, I made it _very easy_ to specify which tests run, so you can simply execute 1 or a few tests while developing, then more as you finish the method you are currently working with.

### Ignore annotation
If you place `'@Ignore` above a test suite, it group, or test case, it will ignore it. i.e. it will not be executed.

You can give a reason for ignoring a test, as part of the annotation's data. e.g.

```
'@Ignore DataStore is being refactored
'@Test that the correct index is NOT found
function Simpl_Datastore_alternate_failures() as void
	item = m.alternateDS.GetDataItemWithIndex(12)
	
	m.AssertInvalid(item)
end function
```

The log reporter will indicate which tests are ignored, if you have log verbosity set to 2 or greater

### Only annotation
If you place `'@Only` above a test suite, it group, or test case, it will run that test in solo mode. In solo mode, execution is limited to those suites, groups or test cases, which also have a `'@Only' annotation.

A good working practice is to put a `'@Only` annotaiton on the suite for the class you are working on, then the group, then the individual test. You can tehn simply remove the annotation from the test when you have finished, and run the tests again, to see if you caused regression in any of the group's tests, then remove from the group and run the suite, then finally remove the `'@Only` annotation from the suite. This will allow you to run the least amount of tests at any time, while you work, giving you the fastest testing turnaround time.


### Only show output for failures
In addition to the the `'@Only` and `'@Ignore` annotations, Rooibos has another mechanism for aiding the TDD process. You are able to execute Rooibos in `showOnblyFailures` mode. In this mode, all tests are executed (according to the `'@Only` and `'@Ignore` annotations); but if any failures are encountered, then only the failures are displayed. If all tests pass, then the stanard test output is shown.

This makes it easy to quickly dive into the test suite and see what regressions have been introduced, then you can simply navigate to the failed tests and annotate them with `'@Only` annotations (so that subsequent runs are much quicker)

This can be achieved by setting `showOnlyFailures` to true in the config, or, more conveniently, passing `showOnlyFailures=true` when launching the tests. An example make file target, might look like this:

```
testFailures:
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&showOnlyFailures=true&logLevel=4"
```

## Integrating with your app setup and util methods

### Hooking into your global setup
It is likely that your app will have some degree of setup (like loading config files, setting global properties, etc), that will be required to occur before starting your unit tests. You can have Rooibos invoke your setup methods, at the correct time during it's setup, by passing a function pointer into the `Rooibos__Init` method, as such:

```    
if (type(Rooibos__Init) = "Function") then Rooibos__Init(args, SetupGlobals)

....

sub SetupGlobals()
'some setup stuff that is pertinent to your app and unit tests
end sub

```

### Adding your own util functions to the unit tests
If you wish, you can provide a third function pointer to the `Rooibos_Init` method, which will receive a _TestCase_ paremeter. You can decorate this TestCase with util methods you want to make accessible to your unit tests at runtime. e.g.


```    
if (type(Rooibos__Init) = "Function") then Rooibos__Init(args, SetupGlobals, DecorateTestUtils)

....

sub DecorateTestUtils(testCase)
	'add rodash
	testCase.r = rodash()
	'add some test utils specific to my project
	testCase.testUtils = TestUtils()
end sub

```

These utility objects/methods/values, will then be available when the test is executed. e.g.

```
'@Test DataReceived
function MyNS_DataReceived() as void
	'using rodash to get the data value for the insert
	m.AssertNotInvalid(m.r.get(result,"data.row[0]",invalid))
end function
```


## Using mocks and stubs
Rooibos can be used for integration, behaviour, unit testing, and TDD. In many cases (particularly TDD and unit testing), we will not want to execute all of the methods invoked by our code; but will instead prefer to mock and stub those method calls.

In other cases, it may simply be impractical to execute code as part of our tests. Examples can be executing method that make network calls, require hardware, or playback, or just simply take to long.

In all of these cases, you can use Rooibos's mocks and stubs in place of real method calls.

### Mocks, Stubs and Fakes

#### Fakes
Fakes are objects, which you can use in place of real methods. They are invoked, receive parameters, and can return values, just like real methods. As far as the invokee is concerned, it _is_ the real method you intended to be executed in your code. Fakes are what Rooibos uses under the hood, to facilitate it's Stub and Mock implementations.

#### Stubs
Stubs are Fakes which are not tracked. This means that you can execute your unit tests, using the fake methods; but Rooibos will not fail your tests if things were not as expected (i.e. wrong params, wrong number of invocations). These can be very handy for setting certain test conditions (i.e. you can create a fake network response that will return a speific result, which drives your test)

To create a stub, we use the `Stub` method:

```
function Stub(target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid) as object
```

 - The target is the object which will have it's method replaced,
 - Method name is the name of the method to replace
 - expectedInvocations is the number of times we expect the method to be called
 - expectedArgs is an array of values we expect the method to be invoked with
 - returnValue is the value we wish to return

##### A simple example
Given a ViewModel, named DetailsVM, which has a method LoadDetails, as such:
```
function LoadDetails() as void
	isNetworkRequestExecuted = m.ExecuteNetRequest("http://my.data.com/get")
	m.isLoading = isNetworkRequestExecuted
	m.isShowingError = not isNetworkRequestExecuted
end function
```

We can use a mock, to facilitate testing against the network layer

```
detailsVM = CreateDetailsVM()
returnJson = {success:false}
m.Stub(detailsVM,"ExecuteNetRequest", invalid, returnJson)

detailsVM.LoadDetails()

m.AssertFalse(detailsVM.isLoading)
m.AssertTure(detailsVM.isShowingError)
```

In this case, our detailsVM object, wil

#### Mocks
Mocks are _expected_ fakes. Your code will invoke the method, as if it _is_ the real method; but the difference is that Rooibos will track the invoction of mocks, and if the method was not invoked in the manner you expected (i.e. with the expected parameters and the expected number of invocations) then a unit test failure will result.

We create mocks by using the methods:

 - Expect - Creates a generic mock
 - ExpectOnce - Creates a mock, which we expect to be called once
 - ExpectNone - Creates a mock, which we _never_ expect to be invoked

### Asserting mocks
Mocks are asserted by invoking `m.AssertMocks()`	
As a convenience, Rooibos will automatically assert any mocks for you when your test finishes executing. This saves you from having to manually add this line at the end of your code.

When a mock fails, Rooibos will report to you what caused the failure. The possible reasons are:

 - The method was invoked by your code, with the wrong parameters
 - The method was invoked too many times by your code
 - The method was never invoked by your code; but it should've been

For example, the above test could be written with mocks as follows:

```
detailsVM = CreateDetailsVM()
returnJson = {success:false}
m.ExpectOnce(detailsVM,"ExecuteNetRequest", invalid, returnJson)

detailsVM.LoadDetails()

m.AssertFalse(detailsVM.isLoading)
m.AssertTure(detailsVM.isShowingError)
```

In addition to the other asserts, Rooibos will autoamtically check that ExecuteNetRequest was executed exactly once

#### Manually Checking mock invocations
If you wish you, you can store a reference to a mock or a stub, and later check the invocation values.

All mock and stub methods return a reference to the _Fake_ that it wired into your code. e.g.

```
executeMock = m.ExpectOnce(detailsVM,"ExecuteNetRequest", invalid, returnJson)

detailsVM.LoadDetails()

? exceuteMock.invokedArgs
? excecuteMock.invocations
```

## Integrating with your CI
As of version 0.1.0, Rooibos does not have special test runners for outputting to files, or uploading to servers. However, that will not stop you integrating with your CI system.

Becuase the test output has a convenient status at the end of the output, you can simply parse the last line of output from the telnet session to ascertain if your CI build's test succeeded or failed.

An example make target might look like

```
#amount of time to wait for unit test execution
ROKU_TEST_WAIT_DURATION=5
ROKU_TEST_ID=[Some identifiter for your tests, should be set by CI as the buildid/git hash]

continuousIntegration: build install
	echo "Running Rooibos Unit Tests"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home" 
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&testId=${ROKU_TEST_ID}"
	-sleep ${ROKU_TEST_WAIT_DURATION} | telnet ${ROKU_DEV_TARGET} 8085 | tee dist/test.log
	echo "=================== CI TESTS FINISHED =================== "
	
	if tail -2 dist/test.log | head | grep -q "RESULT: Success"; then echo "SUCCESS"; else exit -1; fi
	
```	

In the above example, we pipe the output of the telnet session to `dist/test.log`, wait for the test execution to finish, and finally, parse the line of test output to check for the SUCCESS flag.

## Advanced setup

### Advanced use of TestsScene.xml
To use Rooibos, you need to provide a scene (default name `TestsScene.xml`). This scene should be empty; but may well contain code in the init method to setup global values, which you need to execute your runtime code. Consider an application which uses `ModelLocator` pattern, or some other _IOC_ pattern. In this case it would make sense to initiate the pattern in the `TestsScene.xml`, rather than have to set it up in every single test `Setup`.

#### Example TestsScene.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<component
	name="TestsScene"
	extends="Scene"
	xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd"
>
</component>
```

#### Example TestsScene.brs
```
sub Init()
	'Example of an application using ModelLocator pattern
	'many of the codefiles will expect to have access to a global ModelLocator
	'so setting it on the `TestsScene`, makes sense.
	
    m.global.addFields({"modelLocator": createObject("roSGNode", "ModelLocator")})
end sub
```

### Using a different TestsScene.xml
The scene name can be overriden by passing in the desired scene name as the third `Rooibos__Init` parameter. e.g.


```    
if (type(Rooibos__Init) = "Function") then Rooibos__Init(args, SetupGlobals, DecorateTestUtils, "MyOtherTestsScene")
```

 
### Make from source
You can rebuild by running the following command from the terminal:

```make dist```

Which will compress all of the source files in the `src` folder into `dist/rooibos.cat.brs`, which can then be copied to your project
