'@TestSuite [BT] Basic tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests the node context is available for a Node scope function
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 
function BT_NodeScope() as void
  m.assertNotInvalid(m.node)
  BT_doSomethingInNodeScope(true)
  m.assertInvalid(m._isNodeScopeVarSet)
  m.assertTrue(m.node._isNodeScopeVarSet)
end function

function BT_doSomethingInNodeScope(value)
  m._isNodeScopeVarSet = value
end function