'@Ignore - these are handled at compiler level now
'@TestSuite [DGNT] Duplicate Group Name Tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group1
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group1_test()
  m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group2
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group2_test()
  m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group2
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group2_dupe_test()
  m.AssertTrue(true)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group3
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group3_test()
  m.AssertTrue(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It group1
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
function DGNT_group1_dupe_test()
  m.AssertTrue(true)
end function