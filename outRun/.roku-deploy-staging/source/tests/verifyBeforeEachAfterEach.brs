'@TestSuite [BEAER] BeforeEach and AfterEach Running

'@Setup
function BEAER_Setup() as void
  ? "!!! Setup"
end function


'@TearDown
function BEAER_TearDown() as void
    ? "!!! TearDown"
end function

'@BeforeEach
function BEAER_BeforeEach() as void
  ? "!!! Before"
end function


'@AfterEach
function BEAER_AfterEach() as void
    ? "!!! After"
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 1 - should have global before/after 
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 1 
function BEAER_group1_1() as void
  m.AssertTrue(true)
end function

'@Test 2
function BEAER_group1_2() as void
  m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group1_3(values) as void
  m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 2 - should have group before after
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function BEAER_group2_BeforeEach() as void
  ? "!!! Before GROUP 2"
end function


'@AfterEach
function BEAER_group2_AfterEach() as void
    ? "!!! After GROUP 2"
end function

'@Test 1 
function BEAER_group2_1() as void
  m.AssertTrue(true)
end function

'@Test 2
function BEAER_group2_2() as void
  m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group2_3(values) as void
  m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests group 3 - should have global before/after
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 1 
function BEAER_group3_1() as void
  m.AssertTrue(true)
end function

'@Test 2
function BEAER_group3_2() as void
  m.AssertTrue(true)
end function

'@Test 3
'@Params["a"]
'@Params["b"]
'@Params["c"]
function BEAER_group3_3(values) as void
  m.AssertTrue(true)
end function