'@TestSuite [VT] Version tests
function __Tests_VersionTests_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests versionCompare
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test
    '@Params["0.1", "0.1", 0]
    '@Params["1.0", "1.0", 0]
    '@Params["1.0.0", "1.0.0", 0]
    '@Params["1.0.1", "1.0.1", 0]
    '@Params["0.1", "0.2", -1]
    '@Params["1.0", "2.0", -1]
    '@Params["1.0.0", "2.0.0", -1]
    '@Params["2.0.0", "2.0.1", -1]
    '@Params["0.2", "0.1", 1]
    '@Params["2.0", "1.0", 1]
    '@Params["2.0.0", "1.0.0", 1]
    '@Params["2.0.1", "2.0.0", 1]
    instance.versionCompare = function(v1, v2, expected) as void
        m.assertEqual(Rooibos_versionCompare(v1, v2), expected)
    end function
    return instance
end function
function Tests_VersionTests()
    instance = __Tests_VersionTests_builder()
    instance.new()
    return instance
end function