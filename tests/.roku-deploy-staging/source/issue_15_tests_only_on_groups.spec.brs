'ADD '@Only ON NEXT LINE TO TEST
'@TestSuite [RBSA] Rooibos before after tests
function __Tests_OnlyOnGroups_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests one
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test it one
    instance.it_test_one = function() as void
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests two
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test it two
    instance.it_test_two = function() as void
        m.assertTrue(true)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    'ADD '@Only ON NEXT LINE TO TEST
    '@It tests three
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test it three
    instance.it_test_three = function() as void
        m.assertTrue(true)
    end function
    return instance
end function
function Tests_OnlyOnGroups()
    instance = __Tests_OnlyOnGroups_builder()
    instance.new()
    return instance
end function