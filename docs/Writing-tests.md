Rooibos tests must be placed within a group, which in turn must be placed inside a suite.

Tests then comprise assertions, which can test if values are equal, like (using fuzzy logic), contain values, etc.

<a name="simple-assert-syntax"></a>
An assertion looks like this:

```
m.assertTrue(myValue)
```

An example test is as follows.

```
@it("an instantiate with invalid modelLocator")
function Simpl_Basic_true()
    myValue = false
    m.assertTrue(myValue)
end function
```

In this case, the test will fail

![Simple test output](images/simpleFail.png)

Observe how the test output indicates in which file the test suite resides, and the line of the failed assert, plus the reason for the failure. If your IDE has integrated brightscript support, such as eclipse, you will find that the locations are clickable. In this example, clicking on the Location link will navigate the IDE to the exact line of code of the assertion.

Rooibos provids many assertions to test your code with:

 - assertFalse
 - assertTrue
 - assertEqual
 - assertLike
 - assertNotEqual
 - assertInvalid
 - assertNotInvalid
 - assertAAHasKey
 - assertAANotHasKey
 - assertAAHasKeys
 - assertAANotHasKeys
 - assertArrayContains
 - assertArrayNotContains
 - assertArrayContainsSubset
 - assertArrayContainsAAs
 - assertArrayNotContainsSubset
 - assertArrayCount
 - assertArrayNotCount
 - assertEmpty
 - assertNotEmpty
 - assertArrayContainsOnlyValuesOfType
 - assertType
 - assertSubType
 - assertNodeCount
 - assertNodeNotCount
 - assertNodeEmpty
 - assertNodeNotEmpty
 - assertNodeContains
 - assertNodeNotContains
 - assertNodeContainsFields
 - assertNodeNotContainsFields
 - assertAAContainsSubset
 - assertMocks

If an assertion fails, then the next assertions will not run.

#### Special `__rooibosSkipFields` value

If an aa has the `__rooibosSkipFields` value set to an associative array of fields, as follows:

```
myObj = {
  id: "myId"
  refToSomethingThatWillLoopForever: myOtherObjPointingToMyObj
  __rooibosSkipFields: {
    refToSomethingThatWillLoopForever: true
  }
}

```

then rooibos will skip comparing `myObj.refToSomethingThatWillLoopForever` and will skip it when printing that object as as string.

This is useful in some scenarios, such as in maestro framework, where an object, might point to itself (i.e. m and top are the same, and the object has a reference to m.top)

### Async tests

Rooibos runs in sync mode. Due to scenegraph limitations, we can't use observefield. We can workaround this though, using `assertAsyncField`

This assert allows you to wait on a field set on a task, or some other async manipulated object. Use as such:

```
  netTask = createObject("roSGNode", "NetworkTask")
  m.assertAsyncField(netTask, "output")
```

the framework will then check if the output field has changed, every 500 ms for 10 tries

You can control the timeout behaviour by passing delay and maxAttempts, as follows:

```
  '2 second time out, 3 tries
  netTask = createObject("roSGNode", "NetworkTask", 2000, 3)
  m.assertAsyncField(netTask, "output")
```

If the field does not change during the retry period, the assertion will fail.

### Setting up and tearing down
You may find that you have data which is common to all of your tests in a suite. In this case you can desginate functions to run, before and after **all** tests are executed in your suite. To achieve this, simply override the `setup` and `tearDown` functions. In our example above, we could do the following:

```
override function setup()
	m.values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
	m.ds = CreateDataStore(m.values)
end function

@it("finds the correct index")
function _()
	item = m.ds.GetDataItemWithIndex(12)

	m.assertAAContainsSubset(item, m.values[2])
end function
```

### Setup tearDown, beforeEach and afterEach Scoping
Setup and Teardown, can also be scoped to an describe group. If the annotations appear _after_ an `@describe` group annotation, then the setup and teardown will apply only to that group. If the annotations appear _before the first describe group annotation_ then they will be applied to all groups, _which do not have Setup and Teardown group-level-annotations_")

Like `setup` and `tearDown`, `beforeEach` and `afterEach` can be applied to the whole test by overriding the `beforeEach` and `afterEach` functions. You can scope them to `@describe` blocks, by using the `@setUp`, `@tearDown`, `@beforeEach` and `@afterEach` annotation above the relevant function. Note you can call back your test suite class's overall setup, tearDown, beforeEach and afterEach.


### Using BeforeEach and AfterEach
In addition, we can also use beforeEach and afterEach to run before **each and every** test.


```
namespace Tests
  class SampleTest extends Rooibos.BaseTestSuite

    override function setup()
      m.values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
      m.ds = CreateDataStore(m.values)
    end function

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("tests alternate data")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @beforeEach
    function alternateData_beforeEach()
      m.alternateValues = [{index:2,name:"two"},{index:3, name:"three"},{index:20, name:"twenty"}]
      m.alternateDS = CreateDataStore(m.alternateValues)
    end function

    @it("does not find correct index")
    function _()
      item = m.alternateDS.GetDataItemWithIndex(12)

      m.assertInvalid(item)
    end function


    @it("finds correct index")
    function _()
      item = m.alternateDS.GetDataItemWithIndex(3)

      m.assertAAContainsSubset(item, m.alternateValues[1])
    end function
  end class
end namespace
```

Note that in the example above, each of the tests in the `tests alternate data` group, can be run with different values; but we do not need to set the up in each test, or mutate the values used by other tests, which were defined in the `Setup` method.

#### BeforeEach and AfterEach Scoping
BeforeEach and AfterEach, can also be scoped to an describe group. If the annotations appear _after_ an `@describe(" group annotation, then they will only apply to that group. If the annotations appear _before the first describe group annotation_ then they will be applied to all groups, _which do not have BeforeEach and AfterEach group-level-annotations_")

### Paremeterized tests
<a name="parameterized-testing"></a>
Many times, we want to test a broad range of values. Writing identical tests with different values is tedious and unneccessary, using Rooibos's `@params` mechanism

You can run the same test several times, by adding one or more `@params(...)` annotations after the test annotation and before the method declaration, as follows:

```
@it("tests assertTrue")
@params(true, true)
@params(false, false)
@params(invalid, false)
@params(0, false)
@params(1, false)
@params("test", false)
function _(value, expectedassertResult)
...
```

In this case, the test will be run once for each of the `@params` annotations. Note that the method signature takes parameters which correspond to the arguments in the params arrays. Rooibos will give you a build time error, and diagnostic in the ide if you screw this up to save you scratching your head later.

This makes it easy for us to pass in values to our tests, and expected output values, e.g.
```
namespace Tests
  class SampleTest extends Rooibos.BaseTestSuite

    override function setup()
      m.values = [{index:1,name:"one"},{index:4, name:"four"},{index:12, name:"twelve"}]
      m.ds = CreateDataStore(m.values)
    end function

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("tests alternate data")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @beforeEach
    function alternateData_beforeEach()
      m.alternateValues = [{index:2,name:"two"},{index:3, name:"three"},{index:20, name:"twenty"}]
      m.alternateDS = CreateDataStore(m.alternateValues)
    end function

    @it("does not find correct index")
    function _()
      item = m.alternateDS.GetDataItemWithIndex(12)

      m.assertInvalid(item)
    end function


    @it("finds correct index")
    function _()
      item = m.alternateDS.GetDataItemWithIndex(3)

      m.assertAAContainsSubset(item, m.alternateValues[1])
    end function
  end class
end namespace
```

Note that in the example above, each of the tests in the `tests alternate data` group, can be run with different values; but we do not need to set the up in each test, or mutate the values used by other tests, which were defined in the `Setup` method.

#### BeforeEach and AfterEach Scoping
BeforeEach and AfterEach, can also be scoped to an describe group. If the annotations appear _after_ an `@describe(" group annotation, then they will only apply to that group. If the annotations appear _before the first describe group annotation_ then they will be applied to all groups, _which do not have BeforeEach and AfterEach group-level-annotations_")

### Paremeterized tests
<a name="parameterized-testing"></a>
Many times, we want to test a broad range of values. Writing identical tests with different values is tedious and unneccessary, using Rooibos's `@params` mechanism

You can run the same test several times, by adding one or more `@params(...)` annotations after the test annotation and before the method declaration, as follows:

```
@it("tests assertTrue")
@params(true, true)
@params(false, false)
@params(invalid, false)
@params(0, false)
@params(1, false)
@params("test", false)
function _(value, expectedassertResult)
...
```

In this case, the test will be run once for each of the `@params` annotations. Note that the method signature takes parameters which correspond to the arguments in the params arrays. Rooibos will give you a build time error, and diagnostic in the ide if you screw this up to save you scratching your head later.

This makes it easy for us to pass in values to our tests, and expected output values, e.g.

```
@it("schedule shows correct index for now")
@params("04","10","15",0, 6)
@params("04","11","00",0, 7)
@params("05","15","20",1, 15)
@params("05","16","05",1, 17)
@params("05","18","00",1, 19)
function _(dayOfMonth, hour, minute, expectedDayIndex, expectedShowIndex)
	nowDate = SUT.CreateTestDate(dayOfMonth, hour, minute)

	m.scheduleContent.callFunc("UpdateTime", nowDate.asSeconds())
	m.assertEqual(m.scheduleContent.nowDayIndex, expectedDayIndex)
	m.assertEqual(m.scheduleContent.nowShowIndex, expectedShowIndex)
end function
```

Paremeterized tests accept any valid json. However, the number of top level items in the params array must match the amount of arguments for your test method. If they don't the test will fail.

#### Advanced paramter directives

##### #RBSNode

You can instruct rooibos to create nodes as your parameter arguments. To do so, use the special value `"#RBSNode"`, which will create a ContentNode for that value. You can also specify the nod type you wish to create. See the following example for guidance:

```
@it
@params("#RBSNode", "ContentNode")
@params("#RBSNode|Group", "Group")
@params("#RBSNode|Label", "Label")
function _(node, expectedNodeType)
  m.assertSubType(node, expectedNodeType)
end function
```

#### Parameterized test output

The output from paremeterized tests shows the test name, and all of param configurations that were executed, making it easy to ascertain which param config results in a failure

![Simple test output](images/paramTest.png)

#### Ignoring parameterized test configs
If you have a couple of failing param tests, it can assist debugging to ignore the param configs you are not interested in. In this case, you can place the `@params` annotation with `@ignoreParams`, and that config will not execute.

Rooibos 0.2.0, will include an `@onlyParams` annotation for further convenience.

#### Paremeterized tests and other annotations
If a test case has a `@only` or `@ignore` annotation, the _params_ will execute in accordance with their parent test case.

### Node specficic asserts
<a name="node-specific-assertions"></a>
Rooibos adds some node specifc asserts, which are fully described in the   [assertion reference](https://georgejecook.github.io/rooibos/module-BaseTestSuite.html). These are:

 - assertNodeCount
 - assertNodeNotCount
 - assertNodeEmpty
 - assertNodeNotEmpty
 - assertNodeContains
 - assertNodeNotContains
 - assertNodeContainsFields
 - assertNodeNotContainsFields


### Full list of asserts
The full list of asserts can be found in the documentation  - [assertion reference](https://georgejecook.github.io/rooibos/module-BaseTestSuite.html)
