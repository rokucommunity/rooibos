'@TestSuite Basic tests
function __Tests_BasicTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests the node context is available for a Node scope function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 
    instance.NodeScope = function() as void
        m.assertNotInvalid(m.node)
        Tests_doSomethingInNodeScope(true)
        m.assertInvalid(m._isNodeScopeVarSet)
        m.assertTrue(m.node._isNodeScopeVarSet)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests aa's with a mock will not crash the box!
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 
    instance.EqualsFixForStubbedAAs = function() as void
        aa = {
            "test": "value"
        }
        m.expectOnce(aa, "getStubbedObject", [
            aa
        ])
        aa.getStubbedObject(aa)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests aa's that get printed as failures don't crash box
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 
    instance.PrintResultsFixForStubbedAAs = function() as void
        aa = {
            "test": "value"
        }
        bb = {
            "other": "value"
        }
        m.expectOnce(bb, "getStubbedObject", [
            aa
        ])
        m.assertEqual(aa, bb)
        'not crashing on printing the wrong output is a pass
        m.assertMocks()
        m.currentResult.Reset()
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It url in params
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple
    '@Params["http://101.rooibos.com"] 
    instance.urlParams = function(url) as void
        m.assertEqual(url, "http://101.rooibos.com")
    end function
    '@Test on objects
    '@Params[{"url":"http://101.rooibos.com", "othervalue":2}] 
    '@Params[{url:"http://101.rooibos.com", "othervalue":2}] 
    '@Params[{url:"http://101.rooibos.com", othervalue:2}] 
    instance.urlParams_objects = function(aa) as void
        m.assertEqual(aa.url, "http://101.rooibos.com")
        m.assertEqual(aa.othervalue, 2)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests async tests
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Ignore
    '@Test times out
    instance.async_timeout = function()
        item = {
            "id": "item"
        }
        m.assertAsyncField(item, "id")
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertTrue(isFail)
    end function
    return instance
end function
function Tests_BasicTests()
    instance = __Tests_BasicTests_builder()
    instance.new()
    return instance
end function

function Tests_doSomethingInNodeScope(value)
    m._isNodeScopeVarSet = value
end function