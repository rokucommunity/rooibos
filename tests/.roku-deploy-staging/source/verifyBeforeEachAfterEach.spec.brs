'@TestSuite [BEAER] BeforeEach and AfterEach Running
function __Tests_VeritfyBeforeEachAfterEach_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    instance.super0_Setup = instance.Setup
    instance.Setup = function() as void
        print "!!! Setup"
    end function
    instance.super0_TearDown = instance.TearDown
    instance.TearDown = function() as void
        print "!!! TearDown"
    end function
    instance.super0_BeforeEach = instance.BeforeEach
    instance.BeforeEach = function() as void
        print "!!! Before"
    end function
    instance.super0_AfterEach = instance.AfterEach
    instance.AfterEach = function() as void
        print "!!! After"
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests group 1 - should have global before/after 
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 1 
    instance.group1_1 = function() as void
        m.assertTrue(true)
    end function
    '@Test 2
    instance.group1_2 = function() as void
        m.assertTrue(true)
    end function
    '@Test 3
    '@Params["a"]
    '@Params["b"]
    '@Params["c"]
    instance.group1_3 = function(values) as void
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests group 2 - should have group before after
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@BeforeEach
    instance.group2_BeforeEach = function() as void
        print "!!! Before GROUP 2"
    end function
    '@AfterEach
    instance.group2_AfterEach = function() as void
        print "!!! After GROUP 2"
    end function
    '@Test 1 
    instance.group2_1 = function() as void
        m.assertTrue(true)
    end function
    '@Test 2
    instance.group2_2 = function() as void
        m.assertTrue(true)
    end function
    '@Test 3
    '@Params["a"]
    '@Params["b"]
    '@Params["c"]
    instance.group2_3 = function(values) as void
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests group 3 - should have global before/after
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test 1 
    instance.group3_1 = function() as void
        m.assertTrue(true)
    end function
    '@Test 2
    instance.group3_2 = function() as void
        m.assertTrue(true)
    end function
    '@Test 3
    '@Params["a"]
    '@Params["b"]
    '@Params["c"]
    instance.group3_3 = function(values) as void
        m.assertTrue(true)
    end function
    return instance
end function
function Tests_VeritfyBeforeEachAfterEach()
    instance = __Tests_VeritfyBeforeEachAfterEach_builder()
    instance.new()
    return instance
end function