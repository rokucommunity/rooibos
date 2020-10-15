'@TestSuite RCMT Common tests
function __Tests_Common_builder()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.super0_new = instance.new
    instance.new = sub()
        m.super0_new()
    end sub
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests EqArray
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@Test
    '@Params[invalid, [], false]
    '@Params[[], invalid, false]
    '@Params[invalid, invalid, false]
    '@Params[["one", "three"], [], false]
    '@Params[[], ["one", "three"], false]
    '@Params[[], [], true]
    '@Params[["one", "two", "three"], ["one", "three"], false]
    '@Params[["one", "two", "three"], ["one", "two", "three"], true]
    '@Params[[1, 2, 3], ["one", "two", "three"], false]
    '@Params[[1, 2, 3], [1, 2, 3], true]
    '@Params[[1, invalid, "3"], [1, invalid, "3"], true]
    '@Params[[3, 2, 1], [1, 2, 3], false]
    instance.eqArray_Pass = function(values, values2, expected) as void
        result = Rooibos_Common_eqArray(values, values2)
        m.assertEqual(result, expected)
    end function
    return instance
end function
function Tests_Common()
    instance = __Tests_Common_builder()
    instance.new()
    return instance
end function