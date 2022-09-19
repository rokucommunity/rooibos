<a name="organize-tests-by-suites-groups-and-cases"></a>

Rooibos has a hiearchy of tests as follows:

 - Suite
	 - Describe block
		 - it test
			 - Parameterized it test


Test suites are defined by:
 - declaring a class _inside_ a namespace
 - which extends `Rooibos.BaseTestSuite`
 - and has a `@suite` annotation

No special file naming is required. I recommend you call your files `thing.spec.bs` <a name="no-need-for-special-file-or-method-names"></a>

Please note that rooibos tests are _brighterscript_ only. You can test regular brs files; but all your tests must be brightersript files.

### Some advice

I find it really handy to have my own BaseTestSuite, that extends `Rooibos.BaseTestSuite` and I use that as the base of all my tests. In this way I can easily use common utilities and use common beforeEach/setup for setting things up.

### Simple example
The following is a minimum working example of a Rooibos test suite, named `Simple.brs`
<a name="simple-syntax-for-writing-tests"></a>

```
namespace tests

  @suite("basic tests")
  class BasicTests extends Rooibos.BaseTestSuite

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("tests the node context is available for a Node scope function")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @it("does something in node scope")
    function _()
      m.assertNotInvalid(m.node)
      Tests.doSomethingInNodeScope(true)
      m.assertInvalid(m._isNodeScopeVarSet)
      m.assertTrue(m.node._isNodeScopeVarSet)
    end function

  end class

end namespace
```

#### Simple example Notes

1. The `++++++++++++`'s around the `@describe` declaration are not required; but I find it makes the file much easier to read, and recommend it (or something similar, such as `'*****` as a best practice.
2. If you do not provide names for the `@suite` it will use the class name
3. The function name is not required. Rooibos will rename your function to whatever your describe group is (so you can easily navigate in the ide), and as such, the function name cann be anything you like. I like calling all tests functions `_`. Don't worry - the plugin will rename it before you get any duplicate function errors!

### Rooibos annotations
<a name="simple-syntax-for-writing-tests"></a>

Rooibos provides a library of annotations which can be used to define test suites, describe groups, tests cases, Parameterized tests, and more. All annotations are of the following form

NOTE - these are official bsc compiler annotations; not like comments in the previous version of rooibos _do not_ put a `'` in front of the, and use `@brighterscript("argument1", 2, "argument3", ["syntax])`

```
@annotation(args...)
```

Where `ANNOTATION`, is the roku annotation and DATA is the data passed to it. e.g. `@it("that it handles an empty collection")`, defines a test case, with the title `that it handles an empty collection`

Some annotations act as modifiers. In these cases, they will affect some other annotation. For example `@only`, and `@ignore` will affect the following `@suite`, `@it` or `@it` annotation.

The following annotations are supported.

| Annotation                  | Description                                                                                                                                                                                                                                                                                                     | Data                                                                                              |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| @suite                  | Indicates a file is a test suite. Required.                                                                                                                                                                                                                                                                               | Name of the test suite. Used in test output                                                       |
| @SGNode                  | Indicates that a test will run in a node. Rooibos plugin will automatically generate the test node and inject all the test code                                                                                                                                                                                                                                                                            | Name of the component to extend to run tests                                                     |
| @setup                      | Run once when the suite, or describe group is executed <a name="common-tdd-methods"></a>.                                                                                                                                                                                                                                          |                                                                                                   |
| @tearDown                   | Run once when the suite or describe group is finished                                                                                                                                                                                                                                                                             |                                                                                                   |
| @beforeEach                 | Run before each test. Can be specified for the `@suite`, or for each `@it` group                                                                                                                                                                                                                            |                                                                                                   |
| @afterEach                  | Run after each test. Can be specified for the `@suite`, or for each `@it` group                                                                                                                                                                                                                             |                                                                                                   |
| @describe                         | Indicates a group of tests. Groupings improve readability. A group might denote various tests for a given method, or even an aspect of functionality                                                                                                                                                            | Name of the describe group, which is used in the test output                                            |
| @it                       | Indicates a test. Must directly precede a function definition                                                                                                                                                                                                                                             | The name of the test acse, which will be reported in the test output                              |
| @only                       | Precedes a Suite, Describe group, or it test, to indicate that _only that item_ should be executed. This can be used to rapidly filter out tests. Only other `@only` items will be run.                                                                                                                          |                                                                                                   |
| @ignore                     | Precedes a suite, Describe group or it test, to indicate that that item should be ignored. If an `@ignore` tag is found before an item, then it will not be executed as part of the test run                                                                                                                      |                                                                                                   |
| @params[p1,p2,...,p6]       | Indicates a Paremeterized test. Must come _after_ a `@it` annotation. Can accept up to 6 arguments, which are comma separated. When using paremeterized tests, the test function signature _must_ accept the same number of arguments, and each of params statemens, must also have the same number of params | Up to 6 arguments can be any valid brightscript code, which can be parsed with an `eval` function |
| @ignoreParams[p1,p2,...,p6] | A Convenience tag, which makes it easy to temporarily _comment out_ params tests we do not want to run.                                                                                                                                                                                                         | As per `@params`                                                                                  |
| @onlyParams[p1,p2,...,p6]   | A Convenience tag, which makes it easy to temporarily _solor_ params, so you can run one or more of the params in a params block. Very useful for focusing on a failing test case                                                                                                                               | As per `@params`                                                                                  |
| @tags("one","two"..."n")   | Allows indicating the tags to apply to the group,test or suite. This is a really effective way to categorise your test suite. These tags can be used to filter tests in your rooibos bsconfig options.| List of tag names to apply                                                                                  |
| @noatch  | If present, will not catch errors for the test or suite it is placed on. This is handy when developing, and you want to debug the exact line on which an error occurred. | none|
| @noearlyexit  | If present, will not exit a test on an assertion failure, which prevents crashes/skwewed results. This annotation is mainly used for testing, such as testing rooibos framework itself. It is recommend that you _do not_ use this annotation. | none|
