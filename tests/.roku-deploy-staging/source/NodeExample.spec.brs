'@noSGNode NodeExample
'@TestSuite [NET] Node Example Tests
function __Tests_NodeExampleTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    instance.super0_setup = instance.setup
    instance.setup = function() as void
        m.setupThing = "something created during setup"
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests methods present on the node
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    instance.super0_beforeEach = instance.beforeEach
    instance.beforeEach = function() as void
        m.beforeEachThing = "something created beforeEach"
    end function
    '@Test HelloFromNode
    instance.helloFromNode_simple = function() as void
        'bs:disable-next-line
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
    instance.helloFromNode_params = function(name, age) as void
        'bs:disable-next-line
        text = HelloFromNode(name, age)
        m.AssertEqual(text, "HELLO " + name + " age:" + stri(age))
    end function
    return instance
end function
function Tests_NodeExampleTests()
    instance = __Tests_NodeExampleTests_builder()
    instance.new()
    return instance
end function