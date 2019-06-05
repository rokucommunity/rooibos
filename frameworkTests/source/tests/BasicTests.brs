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

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests aa's with a mock will not crash the box!
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 
function BT_EqualsFixForStubbedAAs() as void
  aa = {"test":"value"}
  m.expectOnce(aa, "getStubbedObject", [aa])

  aa.getStubbedObject(aa)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests aa's that get printed as failures don't crash box
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test 
function BT_PrintResultsFixForStubbedAAs() as void
  aa = {"test":"value"}
  bb = {"other": value}
  m.expectOnce(bb, "getStubbedObject", [aa])
  assertEqual(aa, bb)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It url in params
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple
'@Params["http://101.rooibos.com"] 
function BT_urlParams(url) as void
  m.assertEqual(url, "http://101.rooibos.com")
end function

'@Test on objects
'@Params[{"url":"http://101.rooibos.com", "othervalue":2}] 
'@Params[{url:"http://101.rooibos.com", "othervalue":2}] 
'@Params[{url:"http://101.rooibos.com", othervalue:2}] 
function BT_urlParams_objects(aa) as void
  m.assertEqual(aa.url, "http://101.rooibos.com")
  m.assertEqual(aa.othervalue, 2)
end function