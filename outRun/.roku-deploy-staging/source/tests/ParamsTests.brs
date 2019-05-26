'@TestSuite PT ParamsTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests that nodes are created with RBSNode
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test
'@Params["#RBSNode", "ContentNode"]
'@Params["#RBSNode|Group", "Group"]
'@Params["#RBSNode|Label", "Label"]
function PT_RBSNodeDirective(node, expectedNodeType) as void
RBS_CC_8_reportLine(11, 1):   m.assertSubType(node, expectedNodeType)
end function

'@Test node parsed as other arg index
'@Params[1, 2, 3, "#RBSNode", "ContentNode"]
'@Params[1, 2, 3, "#RBSNode|Group", "Group"]
'@Params[1, 2, 3, "#RBSNode|Label", "Label"]
function PT_RBSNodeDirective_otherArgs(arg1, arg2, arg3, node, expectedNodeType) as void
RBS_CC_8_reportLine(19, 1):   m.assertSubType(node, expectedNodeType)
RBS_CC_8_reportLine(20, 1):   m.assertEqual(arg1, 1)
RBS_CC_8_reportLine(21, 1):   m.assertEqual(arg2, 2)
RBS_CC_8_reportLine(22, 1):   m.assertEqual(arg3, 3)
end function

'@Test does not affect regular params
'@Params["#someValue", "#someValue"]
'@Params[22, 22]
'@Params[[1,2,3], [1,2,3]]
function PT_RBSNodeDirective_noSideEffect(arg1, expectedValue) as void
RBS_CC_8_reportLine(30, 1):   m.assertEqual(arg1, expectedValue)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_8_reportLine(lineNumber, reportType = 1)
  if m.global = invalid
    '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    return true
  else
    if m._rbs_ccn = invalid
     '? "Coverage maps are not created - creating now"
      if m.global._rbs_ccn = invalid
        '? "Coverage maps are not created - creating now"
          m.global.addFields({
            "_rbs_ccn": createObject("roSGnode", "CodeCoverage")
          })
      end if
      m._rbs_ccn = m.global._rbs_ccn
     end if
  end if

  m._rbs_ccn.entry = {"f":"8", "l":stri(lineNumber), "r":reportType}
  return true
end function
