function Rooibos_Matcher_anyString(value)
    return Rooibos_Common_isString(value)
end function

function Rooibos_Matcher_anyBool(value)
    return Rooibos_Common_isBoolean(value)
end function

function Rooibos_Matcher_anyNumber(value)
    return Rooibos_Common_isNumber(value)
end function

function Rooibos_Matcher_anyAA(value)
    return Rooibos_Common_isAssociativeArray(value)
end function

function Rooibos_Matcher_anyArray(value)
    return Rooibos_Common_isArray(value)
end function

function Rooibos_Matcher_anyNode(value)
    return Rooibos_Common_isSGNode(value)
end function