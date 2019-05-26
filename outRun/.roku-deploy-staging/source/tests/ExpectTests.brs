'@TestSuite ET ExpectTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests bug with expectOnce not matching values
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test reported case
'@Params[[52], true]
'@Params[invalid, false]
'@Params[[invalid], true]
'@Params[["42"], true]
'@Params[[42], false]
function ET_expectOnce_valuesBug_reported(expectedValue, expectMockFail) as void
RBS_CC_4_reportLine(13, 1):     obj = {
        foo: function(arg0) : return arg0 : end function
    }

RBS_CC_4_reportLine(17, 1):     m.ExpectOnce(obj, "foo", expectedValue)
RBS_CC_4_reportLine(18, 1):     obj.foo(42)
RBS_CC_4_reportLine(19, 1):     m.isAutoAssertingMocks = false
RBS_CC_4_reportLine(20, 1):     m.AssertMocks()
    
RBS_CC_4_reportLine(22, 1):     isFail = m.currentResult.isFail
RBS_CC_4_reportLine(23, 1):     m.currentResult.Reset()
RBS_CC_4_reportLine(24, 1):     m.CleanMocks()
RBS_CC_4_reportLine(25, 1):     m.AssertEqual(isFail, expectMockFail)     
end function




'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_4_reportLine(lineNumber, reportType = 1)
  if m.global = invalid
    '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    return true
  else
    if m._rbs_ccn = invalid
     '? "Coverage maps are not created - creating now"
      if m.global._rbs_ccn = invalid
        '? "Coverage maps are not created - creating now"
          m.global.addFields({
            "_rbs_ccn": createObject("roSGnode", "CodeCoverage")
          })
      end if
      m._rbs_ccn = m.global._rbs_ccn
     end if
  end if

  m._rbs_ccn.entry = {"f":"4", "l":stri(lineNumber), "r":reportType}
  return true
end function
