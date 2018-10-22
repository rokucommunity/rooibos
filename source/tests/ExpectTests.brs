'@TestSuite ET ExpectTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests bug with expectOnce not matching values
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test reported case
'@Params[52, true]
'@Params[invalid, true]
'@Params["42", true]
'@Params[42, false]
function ET_expectOnce_valuesBug_reported(expectedValue, expectMockFail) as void
    obj = {
        foo: function(arg0) : return arg0 : end function
    }

    m.ExpectOnce(obj, "foo", [expectedValue])
    obj.foo(42)
    m.isAutoAssertingMocks = false
    m.AssertMocks()
    
    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    m.CleanMocks()
    m.AssertEqual(isFail, expectMockFail)     
end function
