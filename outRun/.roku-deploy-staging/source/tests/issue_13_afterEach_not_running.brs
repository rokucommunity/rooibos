'@TestSuite [DGNT] Duplicate Group Name Tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group1
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group1_test()
RBS_CC_5_reportLine(8, 1):   m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group2
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group2_test()
RBS_CC_5_reportLine(17, 1):   m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group2
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group2_dupe_test()
RBS_CC_5_reportLine(27, 1):   m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group3
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group3_test()
RBS_CC_5_reportLine(37, 1):   m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group1
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group1_dupe_test()
RBS_CC_5_reportLine(46, 1):   m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_5_reportLine(lineNumber, reportType = 1)
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

  m._rbs_ccn.entry = {"f":"5", "l":stri(lineNumber), "r":reportType}
  return true
end function
