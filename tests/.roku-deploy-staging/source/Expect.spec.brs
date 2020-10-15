'@TestSuite ET ExpectTests
function __Tests_ExpectTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests bug with expectOnce not matching values
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test reported case
    '@Params[[52], true]
    '@Params[invalid, false]
    '@Params[[invalid], true]
    '@Params[["42"], true]
    '@Params[[42], false]
    instance.expectOnce_valuesBug_reported = function(expectedValue, expectMockFail) as void
        obj = {
            foo: function(arg0)
                return arg0
            end function
        }
        m.ExpectOnce(obj, "foo", expectedValue)
        obj.foo(42)
        m.isAutoAssertingMocks = false
        m.assertMocks()
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.CleanMocks()
        m.assertEqual(isFail, expectMockFail)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests mock count limit
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test mock count limit at least 25
    instance.expect_mockCountLimitToBeAtLeast25 = function() as void
        interface = {}
        mockCountLimit = 25
        for i = 1 to mockCountLimit
            keyName = StrI(i).trim()
            interface[keyName] = function(arg0)
                return arg0
            end function
            expectedArg = "a"
            expectedReturnValue = "b"
            m.ExpectOnce(interface, keyName, [
                expectedArg
            ], [
                expectedReturnValue
            ])
            interface[keyName](expectedArg)
        end for
    end function
    return instance
end function
function Tests_ExpectTests()
    instance = __Tests_ExpectTests_builder()
    instance.new()
    return instance
end function