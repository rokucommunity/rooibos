'@TestSuite [Simp] Simple tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test AssertTrue
function Simp__basic_AssertTrue() as void
    m.AssertTrue(true)
end function