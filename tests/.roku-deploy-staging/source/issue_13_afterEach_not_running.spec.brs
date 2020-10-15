'@Ignore - only unignore to test compiler works
'@TestSuite [DGNT] Duplicate Group Name Tests
function __Tests_AfterEachNotRunning_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It group1
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple
    instance.group1_test = function()
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It group2
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple
    instance.group2_test = function()
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It group22
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@BeforeEach
    '@Test simple2
    instance.group2_dupe_test = function()
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It group3
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple
    instance.group3_test = function()
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It group11
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test simple
    instance.group1_dupe_test = function()
        m.assertTrue(true)
    end function
    '@Test simple2
    instance.group1_dupe_test2 = function()
        m.assertTrue(true)
    end function
    return instance
end function
function Tests_AfterEachNotRunning()
    instance = __Tests_AfterEachNotRunning_builder()
    instance.new()
    return instance
end function