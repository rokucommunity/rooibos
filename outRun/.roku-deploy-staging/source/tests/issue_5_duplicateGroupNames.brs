'@TestSuite [RBSA] Rooibos before after tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests before each and after each are running
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function RBSA__BeforeEach() as void
RBS_CC_7_reportLine(8, 1):   ? "!!! Before"
end function


'@AfterEach
function RBSA__AfterEach() as void
RBS_CC_7_reportLine(14, 1):     ? "!!! After"
end function

'@Test before after
function RBSA__before_after() as void

RBS_CC_7_reportLine(20, 1):     assertResult = m.Fail("reason")

RBS_CC_7_reportLine(22, 1):     isFail = m.currentResult.isFail
RBS_CC_7_reportLine(23, 1):     m.currentResult.Reset()

RBS_CC_7_reportLine(25, 1):     m.AssertFalse(assertResult)
RBS_CC_7_reportLine(26, 1):     m.AssertTrue(isFail)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_7_reportLine(lineNumber, reportType = 1)
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

  m._rbs_ccn.entry = {"f":"7", "l":stri(lineNumber), "r":reportType}
  return true
end function
