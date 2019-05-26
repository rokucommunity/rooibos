'@TestSuite [BEAER] BeforeEach and AfterEach Running

'@Setup
function BEAER_Setup() as void
RBS_CC_10_reportLine(4, 1):   ? "!!! Setup"
end function


'@TearDown
function BEAER_TearDown() as void
RBS_CC_10_reportLine(10, 1):     ? "!!! TearDown"
end function

'@BeforeEach
function BEAER_BeforeEach() as void
RBS_CC_10_reportLine(15, 1):   ? "!!! Before"
end function


'@AfterEach
function BEAER_AfterEach() as void
RBS_CC_10_reportLine(21, 1):     ? "!!! After"
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 1 - should have global before/after 
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 1 
function BEAER_group1_1() as void
RBS_CC_10_reportLine(30, 1):   m.AssertTrue(true)
end function

'@Test 2
function BEAER_group1_2() as void
RBS_CC_10_reportLine(35, 1):   m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group1_3(values) as void
RBS_CC_10_reportLine(43, 1):   m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 2 - should have group before after
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function BEAER_group2_BeforeEach() as void
RBS_CC_10_reportLine(52, 1):   ? "!!! Before GROUP 2"
end function


'@AfterEach
function BEAER_group2_AfterEach() as void
RBS_CC_10_reportLine(58, 1):     ? "!!! After GROUP 2"
end function

'@Test 1 
function BEAER_group2_1() as void
RBS_CC_10_reportLine(63, 1):   m.AssertTrue(true)
end function

'@Test 2
function BEAER_group2_2() as void
RBS_CC_10_reportLine(68, 1):   m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group2_3(values) as void
RBS_CC_10_reportLine(76, 1):   m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 3 - should have global before/after
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 1 
function BEAER_group3_1() as void
RBS_CC_10_reportLine(85, 1):   m.AssertTrue(true)
end function

'@Test 2
function BEAER_group3_2() as void
RBS_CC_10_reportLine(90, 1):   m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group3_3(values) as void
RBS_CC_10_reportLine(98, 1):   m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_10_reportLine(lineNumber, reportType = 1)
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

  m._rbs_ccn.entry = {"f":"10", "l":stri(lineNumber), "r":reportType}
  return true
end function
