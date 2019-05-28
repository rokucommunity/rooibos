'@TestSuite [RBSA] Rooibos before after tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests before each and after each are running
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function RBSA__BeforeEach() as void
  ? "!!! Before"
end function


'@AfterEach
function RBSA__AfterEach() as void
    ? "!!! After"
end function

'@Test before after
function RBSA__before_after() as void

    assertResult = m.Fail("reason")

    isFail = m.currentResult.isFail
    m.currentResult.Reset()

    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)
end function