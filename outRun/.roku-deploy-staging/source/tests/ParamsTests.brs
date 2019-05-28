'@TestSuite PT ParamsTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests that nodes are created with RBSNode
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test
'@Params["#RBSNode", "ContentNode"]
'@Params["#RBSNode|Group", "Group"]
'@Params["#RBSNode|Label", "Label"]
function PT_RBSNodeDirective(node, expectedNodeType) as void
  m.assertSubType(node, expectedNodeType)
end function

'@Test node parsed as other arg index
'@Params[1, 2, 3, "#RBSNode", "ContentNode"]
'@Params[1, 2, 3, "#RBSNode|Group", "Group"]
'@Params[1, 2, 3, "#RBSNode|Label", "Label"]
function PT_RBSNodeDirective_otherArgs(arg1, arg2, arg3, node, expectedNodeType) as void
  m.assertSubType(node, expectedNodeType)
  m.assertEqual(arg1, 1)
  m.assertEqual(arg2, 2)
  m.assertEqual(arg3, 3)
end function

'@Test does not affect regular params
'@Params["#someValue", "#someValue"]
'@Params[22, 22]
'@Params[[1,2,3], [1,2,3]]
function PT_RBSNodeDirective_noSideEffect(arg1, expectedValue) as void
  m.assertEqual(arg1, expectedValue)
end function