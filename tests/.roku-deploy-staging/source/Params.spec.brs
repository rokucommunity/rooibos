'@TestSuite PT ParamsTests
function __Tests_ParamsTest_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests that nodes are created with RBSNode
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test
    '@Params["#RBSNode", "ContentNode"]
    '@Params["#RBSNode|Group", "Group"]
    '@Params["#RBSNode|Label", "Label"]
    instance.nodeDirective = function(node, expectedNodeType) as void
        m.assertSubType(node, expectedNodeType)
    end function
    '@Test node parsed as other arg index
    '@Params[1, 2, 3, "#RBSNode", "ContentNode"]
    '@Params[1, 2, 3, "#RBSNode|Group", "Group"]
    '@Params[1, 2, 3, "#RBSNode|Label", "Label"]
    instance.nodeDirective_otherArgs = function(arg1, arg2, arg3, node, expectedNodeType) as void
        m.assertSubType(node, expectedNodeType)
        m.assertEqual(arg1, 1)
        m.assertEqual(arg2, 2)
        m.assertEqual(arg3, 3)
    end function
    '@Test does not affect regular params
    '@Params["#someValue", "#someValue"]
    '@Params[22, 22]
    '@Params[[1,2,3], [1,2,3]]
    instance.nodeDirective_noSideEffect = function(arg1, expectedValue) as void
        m.assertEqual(arg1, expectedValue)
    end function
    return instance
end function
function Tests_ParamsTest()
    instance = __Tests_ParamsTest_builder()
    instance.new()
    return instance
end function