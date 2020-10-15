'@TestSuite [MT] Matcher Tests
function __Tests_MatcherTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    instance.super0_beforeEach = instance.beforeEach
    instance.beforeEach = function()
        'make a mock class
        m.myClass = {}
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests a custom matcher
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test couple of custom matchers
    '@Params[true, false, false]
    '@Params[false, true, true]
    '@Params[false, false, true]
    '@Params[true, true, true]
    instance.matcher_boolean = function(v1, v2, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            {
                "matcher": Tests_Matchers_match_true
            },
            {
                "matcher": Tests_Matchers_match_false
            }
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1, v2), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests a custom inline matcher
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 
    '@Params[true, false, false]
    '@Params[false, true, true]
    '@Params[false, false, true]
    '@Params[true, true, true]
    instance.inline_matcher_boolean = function(v1, v2, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            {
                "matcher": function(value)
                    return value = true
                end function
            },
            {
                "matcher": function(value)
                    return value = false
                end function
            }
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1, v2), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ built in matchers
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test anyBoolMatcher
    '@Params[invalid, true]
    '@Params["false", true]
    '@Params["true", true]
    '@Params[23, true]
    '@Params[{}, true]
    '@Params[[], true]
    '@Params[false, false]
    '@Params[true, false]
    instance.matcher_built_in_anyBoolean = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyBoolMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '@Test anyStringMatcher
    '@Params[invalid, true]
    '@Params["false", false]
    '@Params["true", false]
    '@Params[23, true]
    '@Params[{}, true]
    '@Params[[], true]
    '@Params[false, true]
    '@Params[true, true]
    instance.matcher_built_in_anyString = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyStringMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '@Test anyNumberMatcher
    '@Params[invalid, true]
    '@Params["false", true]
    '@Params["true", true]
    '@Params[23, false]
    '@Params[9, false]
    '@Params[0, false]
    '@Params[0.2, false]
    '@Params[{}, true]
    '@Params[[], true]
    '@Params[false, true]
    '@Params[true, true]
    instance.matcher_built_in_anyNumber = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyNumberMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '@Test anyAAMatcher
    '@Params[invalid, true]
    '@Params["false", true]
    '@Params["true", true]
    '@Params[23, true]
    '@Params[{}, false]
    '@Params[[], true]
    '@Params[false, true]
    '@Params[true, true]
    instance.matcher_built_in_anyAA = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyAAMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '@Test anyArrayMatcher
    '@Params[invalid, true]
    '@Params["false", true]
    '@Params["true", true]
    '@Params[23, true]
    '@Params[{}, true]
    '@Params[[], false]
    '@Params[false, true]
    '@Params[true, true]
    instance.matcher_built_in_anyArray = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyArrayMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '@Test anyNodeMatcher
    '@Params[invalid, true]
    '@Params["false", true]
    '@Params["true", true]
    '@Params[23, true]
    '@Params[{}, true]
    '@Params["#RBSNode", false]
    '@Params[[], true]
    '@Params[false, true]
    '@Params[true, true]
    instance.matcher_built_in_anyNode = function(v1, expectedFail)
        returnValue = "notBroken"
        m.expectOnce(m.myClass, "doWork", [
            m.anyNodeMatcher
        ], returnValue)
        m.assertEqual(m.myClass.doWork(v1), returnValue)
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertEqual(isFail, expectedFail)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ matchers
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    return instance
end function
function Tests_MatcherTests()
    instance = __Tests_MatcherTests_builder()
    instance.new()
    return instance
end function
function Tests_Matchers_match_true(value)
    return value = true
end function

function Tests_Matchers_match_false(value)
    return value = false
end function