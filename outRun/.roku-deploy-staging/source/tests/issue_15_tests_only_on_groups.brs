'ADD '@Only ON NEXT LINE TO TEST
'@TestSuite [RBSA] Rooibos before after tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests one
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test it one
function RBSA__it_test_one() as void
RBS_CC_6_reportLine(9, 1):     m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests two
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test it two
function RBSA__it_test_two() as void
RBS_CC_6_reportLine(18, 1):     m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'ADD '@Only ON NEXT LINE TO TEST
'@It tests three
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test it three
function RBSA__it_test_three() as void
RBS_CC_6_reportLine(28, 1):     m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_6_reportLine(lineNumber, reportType = 1)
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

  m._rbs_ccn.entry = {"f":"6", "l":stri(lineNumber), "r":reportType}
  return true
end function
