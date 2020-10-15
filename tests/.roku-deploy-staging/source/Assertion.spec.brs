'@TestSuite Rooibos assertion tests
function __Tests_AssertionTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests basic assertions
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test Fail
    instance.test_fail = function() as void
        assertResult = m.Fail("reason")
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(assertResult)
        m.assertTrue(isFail)
    end function
    '@Only
    '@Test AssertTrue
    '@Params[true, true]
    '@Params[false, false]
    '@Params[invalid, false]
    '@Params[0, false]
    '@Params[1, false]
    '@Params["test", false]
    instance.test_assertTrue = function(value, expectedAssertResult) as void
        assertResult = m.assertTrue(value)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(assertResult, expectedAssertResult)
        m.assertEqual(isFail, not expectedAssertResult)
    end function
    '@Test AssertFalse
    '@Params[false, true]
    '@Params[true, false]
    '@Params[invalid, false]
    '@Params[0, false]
    '@Params[1, false]
    '@Params["test", false]
    instance.test_assertFalse = function(value, expectedAssertResult) as void
        assertResult = m.assertFalse(value)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 53
      m.assertEqual(assertResult, expectedAssertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 54
      m.assertEqual(isFail, not expectedAssertResult)
    end if
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
    instance.test_assertArrayContainsAAs_Fail = function(expectedAAs, items) as void
        assertResult = m.assertArrayContainsAAs(items, expectedAAs)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 85
      m.assertFalse(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 86
      m.assertTrue(isFail)
    end if
    end function
    '@Test pass
    '@Params[[], []]
    '@Params[[{}], [{}]]
    '@Params[[{"one":1}], [{"one":1}]]
    '@Params[[{"one":1, "two":2}], [{"one":1, "two":2}]]
    '@Params[[{"one":1, "two":2}], [{ "two":2, "one":1}]]
    '@Params[[{"one":1, "two":2}, {"one":1}], [{"one":1}, { "two":2, "one":1}]]
    '@Params[[{"one":1, "two":2}, {"one":1}, {"three":3}], [{"one":1}, {"three":3}, { "two":2, "one":1}]]
    instance.test_assertArrayContainsAAs_Pass = function(expectedAAs, items) as void
        assertResult = m.assertArrayContainsAAs(items, expectedAAs)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 105
      m.assertTrue(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 106
      m.assertFalse(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests global is present on testSuite
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@BeforeEach
    instance.test_assertGlobal_beforeEach = function() as void
        m.beforeEachGlobal = m.global
    end function
    '@AfterEach
    instance.test_assertGlobal_afterEach = function() as void
        m.afterEachGlobal = m.global
    end function
    '@Test global is in test
    instance.test_assertGlobalIsPassedIntoTest = function() as void
        m.assertNotInvalid(m.global)
    end function
    '@Test global is in before each and after each
    instance.test_assertGlobalIsPassedInto_beforeEach_and_afterEach = function() as void
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 130
      m.assertNotInvalid(m.global)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 131
      m.assertNotInvalid(m.beforeEachGlobal)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 132
      m.assertNotInvalid(m.afterEachGlobal)
    end if
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
    instance.test_assertArrayContainsOnlyValuesOfType_Pass = function(values, typeName) as void
        assertResult = m.assertArrayContainsOnlyValuesOfType(values, typeName)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertTrue(assertResult)
        m.assertFalse(isFail)
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
    instance.test_assertArrayContainsOnlyValuesOfType_Fail = function(values, typeName) as void
        assertResult = m.assertArrayContainsOnlyValuesOfType(values, typeName)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 174
      m.assertFalse(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 175
      m.assertTrue(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests white spaces work with annotations
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    'some comments to
    'demonstrate
    '@Test comments between tests
    'that we can have comments
    'between functions and tags
    instance.test_whiteSpacing = function() as void
        m.assertTrue(true)
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
    instance.test_whiteSpacing_params = function(value) as void
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 203
      m.assertTrue(true)
    end if
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
    instance.test_assertNotEmpty_Pass = function(values) as void
        assertResult = m.assertNotEmpty(values)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 224
      m.assertTrue(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 225
      m.assertFalse(isFail)
    end if
    end function
    '@Test fail
    '@Params[invalid]
    '@Params[[]]
    '@Params[{}]
    '@Params[1]
    '@Params[""]
    instance.test_assertNotEmpty_Fail = function(values) as void
        assertResult = m.assertNotEmpty(values)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 241
      m.assertFalse(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 242
      m.assertTrue(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests AssertEmpty
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test pass
    '@Params[[]]
    '@Params[{}]
    '@Params[""]
    instance.test_assertEmpty_Pass = function(values) as void
        assertResult = m.assertEmpty(values)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertTrue(assertResult)
        m.assertFalse(isFail)
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
    instance.test_assertEmpty_Fail = function(values) as void
        assertResult = m.assertEmpty(values)
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 281
      m.assertFalse(assertResult)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 282
      m.assertTrue(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests expect
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test multi return values
    instance.test_expect_multiValues = function()
        obj = {}
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 293
      m.expect(obj, "mockMethod", 5, invalid, {
    "multiResult": [
        "one",
        2,
        invalid,
        "last"
    ]
}, true)
    end if
        result = obj.mockMethod()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 296
      m.assertEqual(result, "one")
    end if
        result = obj.mockMethod()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 299
      m.assertEqual(result, 2)
    end if
        result = obj.mockMethod()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 302
      m.assertEqual(result, invalid)
    end if
        result = obj.mockMethod()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 305
      m.assertEqual(result, "last")
    end if
        result = obj.mockMethod()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 308
      m.assertEqual(result, "last")
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 310
      m.assertMocks()
    end if
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 314
      m.assertFalse(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests expect with overloaded expectOnce
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple test
    instance.test_expect_multiExpect_success = function()
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "mockMethod", [
            arg1
        ], result1, true)
        m.expectOnce(obj, "mockMethod", [
            arg2
        ], result2, true)
        m.expectOnce(obj, "mockMethod", [
            arg3
        ], result3, true)
        result = obj.mockMethod(arg1)
        m.assertEqual(result, result1)
        result = obj.mockMethod(arg2)
        m.assertEqual(result, result2)
        result = obj.mockMethod(arg3)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(isFail)
    end function
    '@Test can set up multi expects on same method - one invocation with any args
    instance.test_expect_multiExpect_success_oneCallsArgsNotTracked = function()
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "mockMethod", [
            arg1
        ], result1, true)
        m.expectOnce(obj, "mockMethod", invalid, result2, true)
        m.expectOnce(obj, "mockMethod", [
            arg3
        ], result3, true)
        result = obj.mockMethod(arg1)
        m.assertEqual(result, result1)
        result = obj.mockMethod("do not care about args", "used in invocation", 2)
        m.assertEqual(result, result2)
        result = obj.mockMethod(arg3)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(isFail)
    end function
    '@Test can set up multi expects on same method - multi params
    instance.test_expect_multiExpect_multi_args_success = function()
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "mockMethod", [
            arg1,
            arg2,
            arg3
        ], result1, true)
        m.expectOnce(obj, "mockMethod", [
            arg2,
            arg3,
            arg1
        ], result2, true)
        m.expectOnce(obj, "mockMethod", [
            arg3,
            arg2,
            arg1
        ], result3, true)
        result = obj.mockMethod(arg1, arg2, arg3)
        m.assertEqual(result, result1)
        result = obj.mockMethod(arg2, arg3, arg1)
        m.assertEqual(result, result2)
        result = obj.mockMethod(arg3, arg2, arg1)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(isFail)
    end function
    '@Test multi test, multi params with other expects
    instance.test_expect_multiExpect_multi_args_others_success = function()
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "anotherMockMethod", invalid, "another", true)
        m.expectOnce(obj, "anotherMockMethod2", [
            1,
            2,
            3
        ], "another2", true)
        m.expectOnce(obj, "mockMethod", [
            arg1,
            arg2,
            arg3
        ], result1, true)
        m.expectOnce(obj, "mockMethod", [
            arg2,
            arg3,
            arg1
        ], result2, true)
        m.expectOnce(obj, "mockMethod", [
            arg3,
            arg2,
            arg1
        ], result3, true)
        result = obj.anotherMockMethod()
        m.assertEqual(result, "another")
        result = obj.anotherMockMethod2(1, 2, 3)
        m.assertEqual(result, "another2")
        result = obj.mockMethod(arg1, arg2, arg3)
        m.assertEqual(result, result)
        result = obj.mockMethod(arg2, arg3, arg1)
        m.assertEqual(result, result2)
        result = obj.mockMethod(arg3, arg2, arg1)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(isFail)
    end function
    '@Test multi test, multi params with other expects - fail others
    instance.test_expect_multiExpect_multi_args_others_fail = function()
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "anotherMockMethod", [
            "not passed"
        ], "another", true)
        m.expectOnce(obj, "anotherMockMethod2", [
            1,
            2,
            3
        ], "another2", true)
        m.expectOnce(obj, "mockMethod", [
            arg1,
            arg2,
            arg3
        ], result1, true)
        m.expectOnce(obj, "mockMethod", [
            arg2,
            arg3,
            arg1
        ], result2, true)
        m.expectOnce(obj, "mockMethod", [
            arg3,
            arg2,
            arg1
        ], result3, true)
        result = obj.anotherMockMethod()
        m.assertEqual(result, "another")
        result = obj.anotherMockMethod2(1, 2, 3)
        m.assertEqual(result, "another2")
        result = obj.mockMethod(arg1, arg2, arg3)
        m.assertEqual(result, result)
        result = obj.mockMethod(arg2, arg3, arg1)
        m.assertEqual(result, result2)
        result = obj.mockMethod(arg3, arg2, arg1)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertTrue(isFail)
    end function
    '@Test can set up multi expects on same method
    '@Params["arg1_", "arg2", "arg3"]
    '@Params["arg1", "arg2", "arg3_"]
    '@Params["arg1", "arg2_", "arg3"]
    '@Params["arg1", "arg2_", "arg3"]
    '@Params["arg1_", "arg2_", "arg3"]
    '@Params["arg1_", invalid, "arg3"]
    instance.test_expect_multiExpect_fail = function(call1, call2, call3)
        obj = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 509
      m.expectOnce(obj, "mockMethod", [
    arg1
], result1, true)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 510
      m.expectOnce(obj, "mockMethod", [
    arg2
], result2, true)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 511
      m.expectOnce(obj, "mockMethod", [
    arg3
], result3, true)
    end if
        result = obj.mockMethod(call1)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 514
      m.assertEqual(result, result1)
    end if
        result = obj.mockMethod(call2)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 517
      m.assertEqual(result, result2)
    end if
        result = obj.mockMethod(call2)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 520
      m.assertEqual(result, result3)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 522
      m.assertMocks()
    end if
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 526
      m.assertTrue(isFail)
    end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests overloaded expectOnce on different objects
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test success
    instance.test_expect_multiExpect_differentOnj_success = function()
        obj = {}
        obj2 = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        m.expectOnce(obj, "mockMethod", [
            arg1
        ], result1, true)
        m.expectOnce(obj, "mockMethod", [
            arg2
        ], result2, true)
        m.expectOnce(obj2, "mockMethod", [
            arg3
        ], result3, true)
        result = obj.mockMethod(arg1)
        m.assertEqual(result, result1)
        result = obj.mockMethod(arg2)
        m.assertEqual(result, result2)
        result = obj2.mockMethod(arg3)
        m.assertEqual(result, result3)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(isFail)
    end function
    '@Test fail to match
    instance.test_expect_multiExpect_differentOnj_fail = function()
        obj = {}
        obj2 = {}
        arg1 = "arg1"
        arg2 = "arg2"
        arg3 = "arg3"
        result1 = 1
        result2 = 2
        result3 = 3
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 576
      m.expectOnce(obj, "mockMethod", [
    arg1
], result1, true)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 577
      m.expectOnce(obj, "mockMethod", [
    arg2
], result2, true)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 578
      m.expectOnce(obj2, "mockMethod", [
    arg3
], result3, true)
    end if
        result = obj.mockMethod(arg1)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 581
      m.assertEqual(result, result1)
    end if
        result = obj.mockMethod(arg2)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 584
      m.assertEqual(result, result2)
    end if
        result = obj2.mockMethod(arg3)
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 587
      m.assertEqual(result, result3)
    end if
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 589
      m.assertMocks()
    end if
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        
    if not m.currentResult.isFail
      m.currentAssertLineNumber = 593
      m.assertFalse(isFail)
    end if
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
    instance.super0_getTestSuiteData = instance.getTestSuiteData
    instance.getTestSuiteData = function()
        return {
            name: "Rooibos assertion tests",
            isSolo: false,
            isIgnored: false,
            filePath: "source/Assertion.spec.bs",
            lineNumber: 3,
            valid: true,
            hasFailures: false,
            hasSoloTests: true,
            hasIgnoredTests: false,
            hasSoloGroups: false,
            setupFunctionName: "",
            tearDownFunctionName: "",
            beforeEachFunctionName: "",
            afterEachFunctionName: "",
            isNodeTest: false,
            nodeName: "",
            generatedNodeName: "Rooibos_assertion_tests",
            testGroups: [
                {
                    name: "tests basic assertions",
                    isSolo: false,
                    isIgnored: false,
                    filename: "source/Assertion.spec.bs",
                    setupFunctionName: "",
                    tearDownFunctionName: "",
                    beforeEachFunctionName: "",
                    afterEachFunctionName: "",
                    testCases: []
                }
            ]
        }
    end function
    return instance
end function
function Tests_AssertionTests()
    instance = __Tests_AssertionTests_builder()
    instance.new()
    return instance
end function