'@Only
'@TestSuite [NET] Node Example Tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test a function on the node
function NET__nodeFunction() as void
    m.AssertTrue(true)
    node = createObject("roSGNode", "NodeExampleTests")
    ? " >>>"
    stop
    node.callFunc("Rooibos_RunNodeTests", {result: m.currentResult, testCase: m})
    ? " >>>"
end function