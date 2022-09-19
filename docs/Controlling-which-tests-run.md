<a name="easily-control-test-execution"></a>
Rooibos is built to facilitate TDD, and other test-based developer workflows. For this reason, I made it _very easy_ to specify which tests run, so you can simply execute 1 or a few tests while developing, then more as you finish the method you are currently working with.

### Ignore annotation
If you place `@ignore` above a test suite, describe group, or test case, it will ignore it. i.e. it will not be executed.

You can give a reason for ignoring a test, as part of the annotation's data. e.g.

```
@ignore DataStore is being refactored
@it("that the correct index is NOT found")
function Simpl_Datastore_alternate_failures()
	item = m.alternateDS.GetDataItemWithIndex(12)

	m.assertInvalid(item)
end function
```

The log reporter will indicate which tests are ignored, if you have log verbosity set to 2 or greater

### Only annotation
If you place `@only` above a test suite, describe group, or test case, it will run that test in solo mode. In solo mode, execution is limited to those suites, groups or test cases, which also have a `@only' annotation.

A good working practice is to put a `@only` annotaiton on the suite for the class you are working on, then the group, then the individual test. You can tehn simply remove the annotation from the test when you have finished, and run the tests again, to see if you caused regression in any of the group's tests, then remove from the group and run the suite, then finally remove the `@only` annotation from the suite. This will allow you to run the least amount of tests at any time, while you work, giving you the fastest testing turnaround time.


### Only show output for failures
<a name="only-show-output-for-failed-tests"></a>
In addition to the the `@only` and `@ignore` annotations, Rooibos has another mechanism for aiding the TDD process. You are able to execute Rooibos in `showOnblyFailures` mode. In this mode, all tests are executed (according to the `@only` and `@ignore` annotations); but if any failures are encountered, then only the failures are displayed. If all tests pass, then the stanard test output is shown.

This makes it easy to quickly dive into the test suite and see what regressions have been introduced, then you can simply navigate to the failed tests and annotate them with `@only` annotations (so that subsequent runs are much quicker)

This can be achieved by setting `showOnlyFailures` to true in the config, or, more conveniently, passing `showOnlyFailures=true` when launching the tests. An example make file target, might look like this:

```
testFailures:
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&showOnlyFailures=true&logLevel=4"
```

### Accessing global scope

Note that all test suites contain the param `nodeContext`, which contains a reference to the node, global object and scene.
