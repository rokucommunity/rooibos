'@TestSuite [RBSA] Rooibos assertion tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
function Simp_basic_Fail() as void

  assertResult = m.Fail("reason")

  isFail = m.currentResult.isFail
  m.currentResult.Reset()

  m.AssertFalse(assertResult)
  m.AssertTrue(isFail)
end function

'@Test AssertTrue
'@Params[true, true]
'@Params[false, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertTrue(value, expectedAssertResult) as void

  assertResult = m.AssertTrue(value)
  isFail = m.currentResult.isFail
  m.currentResult.Reset()

  m.AssertEqual(assertResult, expectedAssertResult)
  m.AssertEqual(isFail, not expectedAssertResult)
end function

'@Test AssertFalse
'@Params[false, true]
'@Params[true, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertFalse(value, expectedAssertResult) as void

  assertResult = m.AssertFalse(value)

  isFail = m.currentResult.isFail
  m.currentResult.Reset()

  m.AssertEqual(assertResult, expectedAssertResult)
  m.AssertEqual(isFail, not expectedAssertResult)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertArrayContainsAAs
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
'@Params[[{"one":1}], [{"one":2}]]
'@Params[[{"one":1}], [{"one":"a"}]]
'@Params[[{"one":1}], [{}]]
'@Params[[{"one":1}], [invalid]]
'@Params[[{"one":1}], []]
'@Params[[{"one":1}], invalid]
'@Params[[{"one":1}], [[]] ]
'@Params[[{"one":1}], ["wrong"] ]
'@Params[[{"one":1}], [2] ]
'@Params[[{"one":"a"}], [{"one":1}] ]
'@Params[[{"two":1}], [{"one":1}] ]
'@Params[[invalid], [{"one":1}] ]
'@Params[invalid, [{"one":1}] ]
'@Params[[{"one":1, "two":2}], [{"one":"1"}] ]
'@Params[[{"one":1}, {"two":2}], [{"one":"1"}, {"two":"a"}] ]
'@Params[[{"one":1}, {"two":2}], [{"a":1}, {"a":1}, {"a":1}] ]
function Simp_AssertArrayContainsAAs_Fail(expectedAAs, items) as void

  assertResult = m.AssertArrayContainsAAs(items, expectedAAs)

  isFail = m.currentResult.isFail
  m.currentResult.Reset()

  m.AssertFalse(assertResult)
  m.AssertTrue(isFail)
end function


'@Test pass
'@Params[[], []]
'@Params[[{}], [{}]]
'@Params[[{"one":1}], [{"one":1}]]
'@Params[[{"one":1, "two":2}], [{"one":1, "two":2}]]
'@Params[[{"one":1, "two":2}], [{ "two":2, "one":1}]]
'@Params[[{"one":1, "two":2}, {"one":1}], [{"one":1}, { "two":2, "one":1}]]
'@Params[[{"one":1, "two":2}, {"one":1}, {"three":3}], [{"one":1}, {"three":3}, { "two":2, "one":1}]]
function Simp_AssertArrayContainsAAs_Pass(expectedAAs, items) as void

  assertResult = m.AssertArrayContainsAAs(items, expectedAAs)

  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(assertResult)
  m.AssertFalse(isFail)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests global is present on testSuite
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function Simp_AssertGlobal_beforeEach() as void
  m.beforeEachGlobal = m.global
end function

'@AfterEach
function Simp_AssertGlobal_afterEach() as void
  m.afterEachGlobal = m.global
end function

'@Test global is in test
function Simp_AssertGlobalIsPassedIntoTest() as void
  m.AssertNotInvalid(m.global)
end function

'@Test global is in before each and after each
function Simp_AssertGlobalIsPassedInto_beforeEach_and_afterEach() as void
  m.AssertNotInvalid(m.global)
  m.AssertNotInvalid(m.beforeEachGlobal)
  m.AssertNotInvalid(m.afterEachGlobal)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertArrayContainsOnlyValuesOfType
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[["one", "two", "three"], "String"]
'@Params[[1, 2, 3], "Integer"]
'@Params[[true, true, false], "Boolean"]
'@Params[[[true, true], [false, false]], "Array"]
'@Params[[{"test":1}, {"test":1}], "AssociativeArray"]
function Simp_AssertArrayContainsOnlyValuesOfType_Pass(values, typeName) as void

  assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(assertResult)
  m.AssertFalse(isFail)

end function

'@Test fail
'@Params[["one", 2, "three"], "String"]
'@Params[[1, "two", 3], "Integer"]
'@Params[[true, "true", false], "Boolean"]
'@Params[[[true, true], false, false], "Array"]
'@Params[[{"test":1}, "notAA"], "AssociativeArray"]
'@Params[["one", "two", "three"], "UnknownType"]
'@Params[["one", "two", "three"], "Integer"]
'@Params[[1, 2, 3], "String"]
'@Params[[true, true, false], "String"]
'@Params[[[true, true], [false, false]], "AssociativeArray"]
'@Params[[{"test":1}, {"test":1}], "Array"]
function Simp_AssertArrayContainsOnlyValuesOfType_Fail(values, typeName) as void

  assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
  isFail = m.currentResult.isFail

  isFail = m.currentResult.isFail
  m.currentResult.Reset()

  m.AssertFalse(assertResult)
  m.AssertTrue(isFail)


end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests white spaces work with annotations
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'some comments to
'demonstrate
'@Test comments between tests
'that we can have comments
'between functions and tags
function Simp_whiteSpacing() as void
  m.AssertTrue(true)
end function

'some comments to
'demonstrate
'@Test comments between tests with params
'@Params[1]

'@Params[2]
'that we can have comments
'@Params[3]
'between functions and tags
'@Params[4]

function Simp_whiteSpacing_params(value) as void
  m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests EqArray
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test
'@Params[invalid, [], false]
'@Params[[], invalid, false]
'@Params[invalid, invalid, false]
'@Params[["one", "three"], [], false]
'@Params[[], ["one", "three"], false]
'@Params[[], [], true]
'@Params[["one", "two", "three"], ["one", "three"], false]
'@Params[["one", "two", "three"], ["one", "two", "three"], true]
'@Params[[1, 2, 3], ["one", "two", "three"], false]
'@Params[[1, 2, 3], [1, 2, 3], true]
'@Params[[1, invalid, "3"], [1, invalid, "3"], true]
'@Params[[3, 2, 1], [1, 2, 3], false]
function Simp_EqArray_Pass(values, values2, expected) as void

  result = m.EqArray(values, values2)
  m.AssertEqual(result, expected)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertNotEmpty
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[["one", "two", "three"]]
'@Params[[1, 2, 3]]
'@Params[[true]]
'@Params[[[true, true], [false, false]]]
'@Params[[{"test":1}]]
'@Params["not empty"]
'@Params[[invalid]]
function Simp_AssertNotEmpty_Pass(values) as void

  assertResult = m.AssertNotEmpty(values)
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(assertResult)
  m.AssertFalse(isFail)

end function

'@Test fail
'@Params[invalid]
'@Params[[]]
'@Params[{}]
'@Params[1]
'@Params[""]
function Simp_AssertNotEmpty_Fail(values) as void

  assertResult = m.AssertNotEmpty(values)
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(assertResult)
  m.AssertTrue(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertEmpty
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[[]]
'@Params[{}]
'@Params[""]
function Simp_AssertEmpty_Pass(values) as void

  assertResult = m.AssertEmpty(values)
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(assertResult)
  m.AssertFalse(isFail)

end function

'@Test fail
'@Params[1]
'@Params[invalid]
'@Params[["one", "two", "three"]]
'@Params[[1, 2, 3]]
'@Params[[true]]
'@Params[[[true, true], [false, false]]]
'@Params[[{"test":1}]]
'@Params["not empty"]
'@Params[[invalid]]
function Simp_AssertEmpty_Fail(values) as void

  assertResult = m.AssertEmpty(values)
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(assertResult)
  m.AssertTrue(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests expect
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test multi return values
function Simp_expect_multiValues()
  obj = {}
  m.expect(obj, "mockMethod", 5, invalid, {"multiResult": ["one", 2, invalid, "last"]}, true)

  result = obj.mockMethod()
  m.AssertEqual(result, "one")

  result = obj.mockMethod()
  m.AssertEqual(result, 2)

  result = obj.mockMethod()
  m.AssertEqual(result, invalid)

  result = obj.mockMethod()
  m.AssertEqual(result, "last")

  result = obj.mockMethod()
  m.AssertEqual(result, "last")

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests expect with overloaded expectOnce
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple test
function Simp_expect_multiExpect_success()
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2], result2, true)
  m.expectOnce(obj, "mockMethod", [arg3], result3, true)

  result = obj.mockMethod(arg1)
  m.AssertEqual(result, result1)

  result = obj.mockMethod(arg2)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(arg3)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)
end function


'@Test can set up multi expects on same method - one invocation with any args
function Simp_expect_multiExpect_success_oneCallsArgsNotTracked()
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1], result1, true)
  m.expectOnce(obj, "mockMethod", invalid, result2, true)
  m.expectOnce(obj, "mockMethod", [arg3], result3, true)

  result = obj.mockMethod(arg1)
  m.AssertEqual(result, result1)

  result = obj.mockMethod("do not care about args", "used in invocation", 2)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(arg3)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'@Test can set up multi expects on same method - multi params
function Simp_expect_multiExpect_multi_args_success()
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
  m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

  result = obj.mockMethod(arg1, arg2, arg3)
  m.AssertEqual(result, result1)

  result = obj.mockMethod(arg2, arg3, arg1)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(arg3, arg2, arg1)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'@Test multi test, multi params with other expects
function Simp_expect_multiExpect_multi_args_others_success()
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "anotherMockMethod", invalid, "another", true)
  m.expectOnce(obj, "anotherMockMethod2", [1,2,3], "another2", true)
  m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
  m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

  result = obj.anotherMockMethod()
  m.AssertEqual(result, "another")

  result = obj.anotherMockMethod2(1, 2, 3)
  m.AssertEqual(result, "another2")

  result = obj.mockMethod(arg1, arg2, arg3)
  m.AssertEqual(result, result)

  result = obj.mockMethod(arg2, arg3, arg1)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(arg3, arg2, arg1)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'@Test multi test, multi params with other expects - fail others
function Simp_expect_multiExpect_multi_args_others_fail()
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "anotherMockMethod", ["not passed"], "another", true)
  m.expectOnce(obj, "anotherMockMethod2", [1,2,3], "another2", true)
  m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
  m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

  result = obj.anotherMockMethod()
  m.AssertEqual(result, "another")

  result = obj.anotherMockMethod2(1, 2, 3)
  m.AssertEqual(result, "another2")

  result = obj.mockMethod(arg1, arg2, arg3)
  m.AssertEqual(result, result)

  result = obj.mockMethod(arg2, arg3, arg1)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(arg3, arg2, arg1)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(isFail)

end function

'@Test can set up multi expects on same method
'@Params["arg1_", "arg2", "arg3"]
'@Params["arg1", "arg2", "arg3_"]
'@Params["arg1", "arg2_", "arg3"]
'@Params["arg1", "arg2_", "arg3"]
'@Params["arg1_", "arg2_", "arg3"]
'@Params["arg1_", invalid, "arg3"]
function Simp_expect_multiExpect_fail(call1, call2, call3)
  obj = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2], result2, true)
  m.expectOnce(obj, "mockMethod", [arg3], result3, true)

  result = obj.mockMethod(call1)
  m.AssertEqual(result, result1)

  result = obj.mockMethod(call2)
  m.AssertEqual(result, result2)

  result = obj.mockMethod(call2)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertTrue(isFail)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests overloaded expectOnce on different objects
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test success
function Simp_expect_multiExpect_differentOnj_success()
  obj = {}
  obj2 = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2], result2, true)
  m.expectOnce(obj2, "mockMethod", [arg3], result3, true)

  result = obj.mockMethod(arg1)
  m.AssertEqual(result, result1)

  result = obj.mockMethod(arg2)
  m.AssertEqual(result, result2)

  result = obj2.mockMethod(arg3)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'@Test fail to match
function Simp_expect_multiExpect_differentOnj_fail()
  obj = {}
  obj2 = {}
  arg1 = "arg1"
  arg2 = "arg2"
  arg3 = "arg3"
  result1 = 1
  result2 = 2
  result3 = 3

  m.expectOnce(obj, "mockMethod", [arg1], result1, true)
  m.expectOnce(obj, "mockMethod", [arg2], result2, true)
  m.expectOnce(obj2, "mockMethod", [arg3], result3, true)

  result = obj.mockMethod(arg1)
  m.AssertEqual(result, result1)

  result = obj.mockMethod(arg2)
  m.AssertEqual(result, result2)

  result = obj2.mockMethod(arg3)
  m.AssertEqual(result, result3)

  m.assertMocks()
  isFail = m.currentResult.isFail

  m.currentResult.Reset()
  m.AssertFalse(isFail)

end function

'ASSERTIONS TO WRITE TESTS FOR!

'This is coming soon!

'    AssertEqual
'    AssertLike
'    AssertNotEqual
'    AssertInvalid
'    AssertNotInvalid
'    AssertAAHasKey
'    AssertAANotHasKey
'    AssertAAHasKeys
'    AssertAANotHasKeys
'    AssertArrayNotContains
'    AssertArrayContainsSubset
'    AssertArrayNotContainsSubsetet
'    AssertArrayCount
'    AssertArrayNotCount
'    AssertArrayContainsOnly
'    AssertType
'    AssertSubType
'
'    'Node extensions
'    AssertNodeCount
'    AssertNodeNotCount
'    AssertNodeEmpty
'    AssertNodeNotEmpty
'    AssertNodeContains
'    AssertNodeNotContains
'    AssertNodeContainsFields
'    AssertNodeNotContainsFields

'    AssertArray
'    AssertAAContainsSubset
'
'    'Mocking and stubbing
'    AssertMocks
'    MockFail