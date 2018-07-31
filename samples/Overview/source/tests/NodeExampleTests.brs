'@SGNode NodeExampleTests
'@TestSuite [NET] Node Example Tests

'@Setup
function NET_setup() as void
    m.setupThing = "something created during setup"
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests methods present on the node
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function NET_BeforeEach() as void
    m.beforeEachThing = "something created beforeEach"
end function

'@Test HelloFromNode
function NET__HelloFromNode_simple() as void
    text = HelloFromNode("georgejecook")
    m.AssertEqual(text, "HELLO georgejecook")
end function

'@Test HelloFromNode with params
'@Params["jon"]
'@Params["ringo"]
'@Params["george"]
'@Params["paul"]
function NET__HelloFromNode_params(name) as void
    text = HelloFromNode(name)
    m.AssertEqual(text, "HELLO " + name)
end function
