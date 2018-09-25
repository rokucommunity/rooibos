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
    text = HelloFromNode("georgejecook", 12)
    m.AssertEqual(text, "HELLO georgejecook" + " age:" + stri(12))
end function

'@Test HelloFromNode with params
'@Params["jon", 40]
'@Params["ringo", 23]
'@Params["ringo", 50]
'@Params["ringo", 24]
'@Params["george", 40]
'@Params["paul", 50]
function NET__HelloFromNode_params(name, age) as void
    text = HelloFromNode(name, age)
    m.AssertEqual(text, "HELLO " + name + " age:" + stri(age))
end function

