'@Ignore - only unignore to test compiler works - remove REMOVE_THIS to test
'@TestSuite [RBSA] REMOVE_THIS Rooibos before after tests
function __Tests_DuplicateGroupNames_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests before each and after each are running
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@BeforeEach
    instance.super0_group_beforeEach = instance.group_beforeEach
    instance.group_beforeEach = function() as void
        print "!!! Before"
    end function
    '@AfterEach
    instance.super0_group_afterEach = instance.group_afterEach
    instance.group_afterEach = function() as void
        print "!!! After"
    end function
    '@Test before after
    instance.before_after = function() as void
        assertResult = m.Fail("reason")
        isFail = m.currentResult.isFail
        m.currentResult.Reset()
        m.assertFalse(assertResult)
        m.assertTrue(isFail)
    end function
    return instance
end function
function Tests_DuplicateGroupNames()
    instance = __Tests_DuplicateGroupNames_builder()
    instance.new()
    return instance
end function