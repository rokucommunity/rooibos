'@SGNode NodeExampleTests
'@TestSuite [NET] Node Example Tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test a function on the node
function NET__nodeFunction() as void
    ? " >>>"
    ? " >>>"
    ? " >>>"
    ? " >>>"
    m.AssertTrue(true)
    ? "TOP " ; m.node.top
    ? "m" ; m.node
    ? m
    ? " >>>2"
    ? " >>>2"
    ? " >>>2"
    ? " >>>2"
    ? " >>>2"
end function