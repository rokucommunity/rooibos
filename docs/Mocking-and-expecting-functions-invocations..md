#### Mocks
Mocks are _expected_ fakes. Your code will invoke the method, as if it _is_ the real method; but the difference is that Rooibos will track the invoction of mocks, and if the method was not invoked in the manner you expected (i.e. with the expected parameters and the expected number of invocations) then a unit test failure will result.

We create mocks by using the methods:

 - expectCalled - creates a stub for an invocation; and fails the test if it was called with the wrong params, or the wrong amount of times
 - expectNotCalled - creates a stub for an invocation; and fails the test if it was called

expectCalled is used as follows:

function expectCalled(invocation, returnValue)

- invocation is a method invocation, or function pointer on a stubbable object
  - it can be a real invocation, e.g. `m.expectCalled(screen.loader.loadData(item1, item2))` in which case it will expect that `loadData` is called on `screen.loader` with those exact args
 - note you can use callfunc @. operator too, when you expect a function to be called on an node: `m.expectCalled(screen.loader@.loadData(item1, item2))`
  - it can be a function pointer, e.g. `m.expectCalled(screen.loader.loadData)` in which case `loadData` is called on `screen.loader`; but not care what aregs were used

- return value is the value returned - so `m.expectCalled(screen.loader.loadData(item1, item2), "data")`, will expect that function to be called, and when it is invoked, return the value `"data"`

Note: expectCalled and expectNotCalled are bsc-plugin magic. you can observes from the transpiled code that the bsc-plugin for rooibos is automatically transpiling these invocations to internal methods, which ultimate call the legacy _expectOnce_ and _expectNone_ methods.

We favor the new functions, in every case, except for the very rare exceptions, described below, which you are unlikely to face.

### asserting mocks

As a convenience, Rooibos will automatically assert any mocks for you when your test finishes executing _before all other asserts_.

If you need to assert them manually, you can do this:

```m.assertMocks()```


When a mock fails, Rooibos will report to you what caused the failure. The possible reasons are:

 - The method was invoked by your code, with the wrong parameters
 - The method was invoked too many times by your code
 - The method was never invoked by your code; but it should've been


#### Manually Checking mock invocations
**IMPORTANT: this mechansim does not yet support the new `expectCalled` function pointer semantics - if you want to do this you have to use the old syntax.**
**This will be updated in due course.**
 
If you wish you, you can store a reference to a mock or a stub, and later check the invocation values.

All mock and stub methods return a reference to the _Fake_ that it wired into your code. e.g.

```
executeMock = m.expectOnce(detailsVM,"ExecuteNetRequest", invalid, returnJson)

detailsVM.LoadDetails()

? exceuteMock.invokedArgs
? excecuteMock.invocations
```

#### Specifying expected invocation arguments
You can save yourself a lot of time, and really think about and kick the tyres of your code, by defining the arguments you expect a function to be invoked with. This is done by passing in an array of the expected invocation arguments via the expectedArgs param. You may also really not care about the args, in which case you can set that value to `invalid` and the call to `m.assertMocks()` will skip checking the invoked args.

#### assertion limitations.

 - Up to 15 arguments are supported on mocked methods
 - You can have up to 24 mocks.

#### Expecting several calls to the same method, with verified invocation params

You may wish to call the same method various times, and return different values, or check different arguments were invoked

In this case, we use overloaded `expectCalled` calls, as per the following example:

```
  m.expectCalled(obj.mockMethod(arg1), result1)
  m.expectCalled(obj.mockMethod(arg2), result2)
  m.expectCalled(obj.mockMethod(arg3), result3)
```

This will now set the framework to expect 3 calls to mockMethod, the first with value of _arg1_, returning _result1_; the second with value of _arg2_, returning _result2_; and the last with value of _arg3_, returning _result3_


#### Specifying an expected value of invalid, with m.invalidValue

If you specify the invoked args, then by default, rooibos will check that the invoked args match the arguments you specify. You can expect any value for an arg, or use the special `m.invalidValue` to indicate you expect the argument to be invalid. This is the default value.

So for example, if one had the following mock

```m.expectCalled(myObj.myMethod("a", "b"), true)```

and `myMethod` was invoked with `["a", "b", "c"]`, this would be a mock failure, because the 3rd argument was expected to be invalid, by default.

In that case, the following mock definition would satisfy the assertion:

```m.expectCalled(myObj.myMethod("a", "b", "c"), true)```

#### Skipping value assertion with m.ignoreValue

If you only care about some arguments, then you can use `m.ignoreValue` to instruct rooibos to not assert equality for the arguments you've ignored.

In the above example, the assertion will be satisfied with a mock confiugred thusly:

```m.expectCalled(myObj.myMethod("a", "b", m.ignoreValue), true)```

This will pass when `myMethod` is invoked with args: `["a", "b", "c"]`, as would the following mock definition:

```m.expectCalled(myObj.myMethod(m.ignoreValue, "b", "c"), true)```


#### Using matchers to assert mock invocation args

In addition to the other basic matchers described above, rooibos provides a set of pre-defined _any_ matchers, and a mechansim for you to provide custom matchers for any mock argument.

##### Built in matchers

Rooibos has matchers that will pass, if the values are of the specified _anyXXXMatcher_ type. For convenience, the matchers are stored on `m.anyXXXMatcher` on your test suite. The following are available.

 - anyBoolMatcher
 - anyNumberMatcher
 - anyStringMatcher
 - anyArrayMatcher
 - anyAAMatcher
 - anyNodeMatcher

Simply specify the matcher in your mock definition, as follows:

```m.expectCalled(myObj.myMethod(m.anyStringMatcher, m.anyBoolMatcher), true)```

In this case, the mock be satisfied if it was called with 2 params, the first one a string, the second a bool, both of any value.

##### Custom matchers.

It is simple to use a custom matcher to assert your mock arguments. Simply:

 - implement a function that takes one argument, and returns true or false
 - ensure it's in scope
 - return your function (either by pointer, or inline), in an aa as follow: `{"matcher": yourMatcherFunction}

For example, using a function pointer (.brs):

```
  m.expectCalled(m.myClass.doWork({"matcher": Rooibos_Matcher_anyArray}), returnValue)
```

For example, using a function pointer (bs):

```
  m.expectCalled(m.myClass.doWork({"matcher": Rooibos.Matcher.anyArray}), returnValue)
```

And inline:

```
  m.expectCalled(m.myClass.doWork({ "matcher": function(value)
        return value = true
    end function }), returnValue)
```


#### returning values from your mocks

**IMPORTANT: this mechansim does not yet support the new `expectCalled` function pointer semantics - if you want to do this you have to use the old syntax.**
**This will be updated in due course.**


Simply set your return value to a non-invalid value, to specify a return value.
You can also specify multiple return values, if you expect your mock to be executed multiple times, and would like to use different values. In that case, return a pobo, with the special key : `multiResult`. The value will be returned for each invocation - if the mock is invoked more than the number of return values, the last one is reutrned. e.g.

```
  m.expect(obj, "mockMethod", 5, invalid, {"multiResult": ["one", 2, invalid, "last"]}, true)

  m.assertEqual(obj.mockMethod(), "one")
  m.assertEqual(obj.mockMethod(), 2)
  m.assertEqual(obj.mockMethod(), invalid)
  m.assertEqual(obj.mockMethod(), "last")
  m.assertEqual(obj.mockMethod(), "last")

```

### Allowing mocking of non-existent functions
rooibos allows you to mock functions that do not exist, so you can easily create any `{}` dictionary and start prentending it's your code.

```
videoService = {}
m.expectCalled(videoService.getVideos(), someJson)
```

Note, you can also opt to disable the error at the whole test suite level; by setting `m.allowNonExistingMethods = true` in your test suite code.


### Mock limitations
- mocks DO NOT work with globally scoped methods (i.e. subs and functions which are not assigned to an associative array). 
    - E.g. if you have a method, which is not accessed via `m.SomeMethod`, or `someObject.SomeMethod`, then you cannot mock it. 
    - This is a long term limitation, with no plans to remedy it. Class based development is way more fun anyhow, give it a go :)