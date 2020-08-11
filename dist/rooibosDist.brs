'/**
' * rooibos - simple, flexible, fun brightscript test framework for roku scenegraph apps
' * @version v4.0.0
' * @link https://github.com/georgejecook/rooibos#readme
' * @license MIT
' */
function __Rooibos_BaseTestSuite_builder()
    instance = {}
    instance.new = sub()
        m.name = "BaseTestSuite"
        m.invalidValue = "#ROIBOS#INVALID_VALUE"
        m.ignoreValue = "#ROIBOS#IGNORE_VALUE"
        m.anyStringMatcher = {
            "matcher": Rooibos_Matcher_anyString
        }
        m.anyBoolMatcher = {
            "matcher": Rooibos_Matcher_anyBool
        }
        m.anyNumberMatcher = {
            "matcher": Rooibos_Matcher_anyNumber
        }
        m.anyAAMatcher = {
            "matcher": Rooibos_Matcher_anyAA
        }
        m.anyArrayMatcher = {
            "matcher": Rooibos_Matcher_anyArray
        }
        m.anyNodeMatcher = {
            "matcher": Rooibos_Matcher_anyNode
        }
        m.allowNonExistingMethodsOnMocks = true
        m.isAutoAssertingMocks = true
        m.testCases = []
    end sub
    instance.addTest = function(name, func, funcName, setup = invalid, teardown = invalid)
        m.testCases.Push(m.createTest(name, func, setup, teardown))
    end function
    instance.createTest = function(name, func, funcName, setup = invalid, teardown = invalid) as object
        if (func = invalid) then
            print " ASKED TO CREATE TEST WITH INVALID FUNCITON POINTER FOR FUNCTION " ; funcName
        end if
        return {
            name: name,
            func: func,
            funcName: funcName,
            setUp: setup,
            tearDown: teardown
        }
    end function
    instance.fail = function(msg = "Error") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult(msg)
        return m.getLegacyCompatibleReturnValue(false)
    end function
    instance.getLegacyCompatibleReturnValue = function(value) as object
        if (value = true) then
            if (m.isLegacy = true) then
                return ""
            else
                return true
            end if
        else
            if (m.isLegacy = true) then
                return "ERROR"
            else
                return false
            end if
        end if
    end function
    instance.assertFalse = function(expr, msg = "Expression evaluates to true") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if not Rooibos_Common_isBoolean(expr) or expr then
            return m.fail(msg)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertTrue = function(expr, msg = "Expression evaluates to false")
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if not Rooibos_Common_isBoolean(expr) or not expr then
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertEqual = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if not Rooibos_Common_eqValues(first, second) then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " != " + second_as_string
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertLike = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if first <> second then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " != " + second_as_string
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNotEqual = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_eqValues(first, second) then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " == " + second_as_string
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertInvalid = function(value, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if value <> invalid then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " <> Invalid"
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNotInvalid = function(value, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if value = invalid then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " = Invalid"
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertAAHasKey = function(array, key, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) then
            if not array.DoesExist(key) then
                if msg = "" then
                    msg = "Array doesn't have the '" + key + "' key."
                end if
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertAANotHasKey = function(array, key, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) then
            if array.DoesExist(key) then
                if msg = "" then
                    msg = "Array has the '" + key + "' key."
                end if
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertAAHasKeys = function(array, keys, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isArray(keys) then
            for each key in keys
                if not array.DoesExist(key) then
                    if msg = "" then
                        msg = "Array doesn't have the '" + key + "' key."
                    end if
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertAANotHasKeys = function(array, keys, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isArray(keys) then
            for each key in keys
                if array.DoesExist(key) then
                    if msg = "" then
                        msg = "Array has the '" + key + "' key."
                    end if
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayContains = function(array, value, key = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if not Rooibos_Common_arrayContains(array, value, key) then
                msg = "Array doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayContainsAAs = function(array, values, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if not Rooibos_Common_isArray(values) then
            msg = "values to search for are not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isArray(array) then
            for each value in values
                isMatched = false
                if not Rooibos_Common_isAssociativeArray(value) then
                    msg = "Value to search for was not associativeArray " + Rooibos_Common_asString(value)
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
                for each item in array
                    if (Rooibos_Common_IsAssociativeArray(item)) then
                        isValueMatched = true
                        for each key in value
                            fieldValue = value[key]
                            itemValue = item[key]
                            if (not Rooibos_Common_eqValues(fieldValue, itemValue)) then
                                isValueMatched = false
                                exit for
                            end if
                        end for
                        if (isValueMatched) then
                            isMatched = true
                            exit for
                        end if
                    end if
                end for ' items in array
                if not isMatched then
                    msg = "array missing value: " + Rooibos_Common_asString(value)
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for 'values to match
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayNotContains = function(array, value, key = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if Rooibos_Common_arrayContains(array, value, key) then
                msg = "Array has the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayContainsSubset = function(array, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if (Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isAssociativeArray(subset)) or (Rooibos_Common_isArray(array) and Rooibos_Common_isArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            for each item in subset
                key = invalid
                value = item
                if isAA then
                    key = item
                    value = subset[key]
                end if
                if not Rooibos_Common_arrayContains(array, value, key) then
                    msg = "Array doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayNotContainsSubset = function(array, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if (Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isAssociativeArray(subset)) or (Rooibos_Common_isArray(array) and Rooibos_Common_isArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            for each item in subset
                key = invalid
                value = item
                if isAA then
                    key = item
                    value = item[key]
                end if
                if Rooibos_Common_arrayContains(array, value, key) then
                    msg = "Array has the '" + Rooibos_Common_asString(value) + "' value."
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayCount = function(array, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if array.Count() <> count then
                msg = "Array items count " + Rooibos_Common_asString(array.Count()) + " <> " + Rooibos_Common_asString(count) + "."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayNotCount = function(array, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if array.Count() = count then
                msg = "Array items count = " + Rooibos_Common_asString(count) + "."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertEmpty = function(item, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(item) or Rooibos_Common_isArray(item) then
            if item.count() > 0 then
                msg = "Array is not empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else if (Rooibos_Common_isString(item)) then
            if (Rooibos_Common_asString(item) <> "") then
                msg = "Input value is not empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "AssertEmpty: Input value was not an array or a string"
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNotEmpty = function(item, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(item) or Rooibos_Common_isArray(item) then
            if item.count() = 0 then
                msg = "Array is empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else if Rooibos_Common_isString(item) then
            if (item = "") then
                msg = "Input value is empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not a string or array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertArrayContainsOnlyValuesOfType = function(array, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if typeStr <> "String" and typeStr <> "Integer" and typeStr <> "Boolean" and typeStr <> "Array" and typeStr <> "AssociativeArray" then
            msg = "Type must be Boolean, String, Array, Integer, or AssociativeArray"
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            methodName = "Rooibos_Common_Is" + typeStr
            typeCheckFunction = m.getIsTypeFunction(methodName)
            if (typeCheckFunction <> invalid) then
                for each item in array
                    if not typeCheckFunction(item) then
                        msg = Rooibos_Common_asString(item) + "is not a '" + typeStr + "' type."
                        m.currentResult.addResult(msg)
                        return m.getLegacyCompatibleReturnValue(false)
                    end if
                end for
            else
                msg = "could not find comparator for type '" + typeStr + "' type."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.getIsTypeFunction = function(name)
        if name = "Rooibos_Common_IsFunction" then
            return Rooibos_Common_isFunction
        else if name = "Rooibos_Common_IsXmlElement" then
            return Rooibos_Common_isXmlElement
        else if name = "Rooibos_Common_IsInteger" then
            return Rooibos_Common_isInteger
        else if name = "Rooibos_Common_IsBoolean" then
            return Rooibos_Common_isBoolean
        else if name = "Rooibos_Common_IsFloat" then
            return Rooibos_Common_isFloat
        else if name = "Rooibos_Common_IsDouble" then
            return Rooibos_Common_isDouble
        else if name = "Rooibos_Common_IsLongInteger" then
            return Rooibos_Common_isLongInteger
        else if name = "Rooibos_Common_IsNumber" then
            return Rooibos_Common_isNumber
        else if name = "Rooibos_Common_IsList" then
            return Rooibos_Common_isList
        else if name = "Rooibos_Common_IsArray" then
            return Rooibos_Common_isArray
        else if name = "Rooibos_Common_IsAssociativeArray" then
            return Rooibos_Common_isAssociativeArray
        else if name = "Rooibos_Common_IsSGNode" then
            return Rooibos_Common_isSGNode
        else if name = "Rooibos_Common_IsString" then
            return Rooibos_Common_isString
        else if name = "Rooibos_Common_IsDateTime" then
            return Rooibos_Common_isDateTime
        else if name = "Rooibos_Common_IsUndefined" then
            return Rooibos_Common_isUndefined
        else
            return invalid
        end if
    end function
    instance.assertType = function(value, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(value) <> typeStr then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " was not expected type " + typeStr
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertSubType = function(value, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(value) <> "roSGNode" then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " was not a node, so could not match subtype " + typeStr
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        else if (value.subType() <> typeStr) then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + "( type : " + value.subType() + ") was not of subType " + typeStr
            end if
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeCount = function(node, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() <> count then
                msg = "node items count <> " + Rooibos_Common_asString(count) + ". Received " + Rooibos_Common_asString(node.getChildCount())
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeNotCount = function(node, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() = count then
                msg = "node items count = " + Rooibos_Common_asString(count) + "."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeEmpty = function(node, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() > 0 then
                msg = "node is not empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeNotEmpty = function(node, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if node.Count() = 0 then
                msg = "Array is empty."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeContains = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if not Rooibos_Common_nodeContains(node, value) then
                msg = "Node doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeContainsOnly = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if not Rooibos_Common_nodeContains(node, value) then
                msg = "Node doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            else if node.getChildCount() <> 1 then
                msg = "Node Contains speicified value; but other values as well"
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeNotContains = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if type(node) = "roSGNode" then
            if Rooibos_Common_nodeContains(node, value) then
                msg = "Node has the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.addResult(msg)
                return m.getLegacyCompatibleReturnValue(false)
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeContainsFields = function(node, subset, ignoredFields = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if (type(node) = "roSGNode" and Rooibos_Common_isAssociativeArray(subset)) or (type(node) = "roSGNode" and Rooibos_Common_isArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            isIgnoredFields = Rooibos_Common_isArray(ignoredFields)
            for each key in subset
                if (key <> "") then
                    if (not isIgnoredFields or not Rooibos_Common_arrayContains(ignoredFields, key)) then
                        subsetValue = subset[key]
                        nodeValue = node[key]
                        if not Rooibos_Common_eqValues(nodeValue, subsetValue) then
                            msg = key + ": Expected '" + Rooibos_Common_asString(subsetValue) + "', got '" + Rooibos_Common_asString(nodeValue) + "'"
                            m.currentResult.addResult(msg)
                            return m.getLegacyCompatibleReturnValue(false)
                        end if
                    end if
                else
                    print "Found empty key!"
                end if
            end for
        else
            msg = "Input value is not an Node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertNodeNotContainsFields = function(node, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if (type(node) = "roSGNode" and Rooibos_Common_isAssociativeArray(subset)) or (type(node) = "roSGNode" and Rooibos_Common_isArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            for each item in subset
                key = invalid
                value = item
                if isAA then
                    key = item
                    value = item[key]
                end if
                if Rooibos_Common_nodeContains(node, value) then
                    msg = "Node has the '" + Rooibos_Common_asString(value) + "' value."
                    m.currentResult.addResult(msg)
                    return m.getLegacyCompatibleReturnValue(false)
                end if
            end for
        else
            msg = "Input value is not an Node."
            m.currentResult.addResult(msg)
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.assertAAContainsSubset = function(array, subset, ignoredFields = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if (Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isAssociativeArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            isIgnoredFields = Rooibos_Common_isArray(ignoredFields)
            for each key in subset
                if (key <> "") then
                    if (not isIgnoredFields or not Rooibos_Common_arrayContains(ignoredFields, key)) then
                        subsetValue = subset[key]
                        arrayValue = array[key]
                        if not Rooibos_Common_eqValues(arrayValue, subsetValue) then
                            msg = key + ": Expected '" + Rooibos_Common_asString(subsetValue) + "', got '" + Rooibos_Common_asString(arrayValue) + "'"
                            m.currentResult.addResult(msg)
                            return m.getLegacyCompatibleReturnValue(false)
                        end if
                    end if
                else
                    print "Found empty key!"
                end if
            end for
        else
            msg = "Input values are not an Associative Array."
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    instance.stub = function(target, methodName, returnValue = invalid, allowNonExistingMethods = false) as object
        if (type(target) <> "roAssociativeArray") then
            m.fail("could not create Stub provided target was null")
            return {}
        end if
        if (m.stubs = invalid) then
            m.__stubId = - 1
            m.stubs = {}
        end if
        m.__stubId++
        if (m.__stubId > 5) then
            print "ERROR ONLY 6 STUBS PER TEST ARE SUPPORTED!!"
            return invalid
        end if
        id = stri(m.__stubId).trim()
        fake = m.createFake(id, target, methodName, 1, invalid, returnValue)
        m.stubs[id] = fake
        allowNonExisting = m.allowNonExistingMethodsOnMocks = true or allowNonExistingMethods
        isMethodPresent = type(target[methodName]) = "Function" or type(target[methodName]) = "roFunction"
        if (isMethodPresent or allowNonExisting) then
            target[methodName] = m["StubCallback" + id]
            target.__stubs = m.stubs
            if (not isMethodPresent) then
                print "WARNING - stubbing call " ; methodName ; " which did not exist on target object"
            end if
        else
            print "ERROR - could not create Stub : method not found  " ; target ; "." ; methodName
        end if
        return fake
    end function
    instance.expectOnce = function(target, methodName, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 1, expectedArgs, returnValue, allowNonExistingMethods)
    end function
    instance.expectOnceWLN = function(lineNumber, target, methodName, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 1, expectedArgs, returnValue, allowNonExistingMethods, lineNumber)
    end function
    instance.expectOnceOrNone = function(target, methodName, isExpected, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        if isExpected then
            return m.expectOnce(target, methodName, expectedArgs, returnValue, allowNonExistingMethods)
        else
            return m.expectNone(target, methodName, allowNonExistingMethods)
        end if
    end function
    instance.expectOnceOrNoneWLN = function(lineNumber, target, methodName, isExpected, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        if isExpected then
            return m.expectOnceWLN(lineNumber, target, methodName, expectedArgs, returnValue, allowNonExistingMethods)
        else
            return m.expectNoneWLN(lineNumber, target, methodName, allowNonExistingMethods)
        end if
    end function
    instance.expectNone = function(target, methodName, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 0, invalid, invalid, allowNonExistingMethods)
    end function
    instance.expectNoneWLN = function(lineNumber, target, methodName, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 0, invalid, invalid, allowNonExistingMethods, lineNumber)
    end function
    instance.expect = function(target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, expectedInvocations, expectedArgs, returnValue, allowNonExistingMethods)
    end function
    instance.expectWLN = function(lineNumber, target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, expectedInvocations, expectedArgs, returnValue, allowNonExistingMethods, lineNumber)
    end function
    instance.mock = function(target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false, lineNumber = - 1) as object
        if not Rooibos_Common_isAssociativeArray(target) then
            methodName = ""
            m.mockFail(lineNumber, "", "mock args: target was not an AA")
        else if not Rooibos_Common_isString(methodName) then
            methodName = ""
            m.mockFail(lineNumber, "", "mock args: methodName was not a string")
        else if not Rooibos_Common_isNumber(expectedInvocations) then
            m.mockFail(lineNumber, methodName, "mock args: expectedInvocations was not an int")
        else if not Rooibos_Common_isArray(expectedArgs) and Rooibos_Common_isValid(expectedArgs) then
            m.mockFail(lineNumber, methodName, "mock args: expectedArgs was not invalid or an array of args")
        else if Rooibos_Common_isUndefined(expectedArgs) then
            m.mockFail(lineNumber, methodName, "mock args: expectedArgs undefined")
        else if Rooibos_Common_isUndefined(returnValue) then
            m.mockFail(lineNumber, methodName, "mock args: returnValue undefined")
        end if
        if m.currentResult.isFail then
            print "ERROR! Cannot create MOCK. method " ; methodName ; " " ; str(lineNumber) ; " " ; m.currentResult.messages.peek()
            return {}
        end if
        if (m.mocks = invalid) then
            m.__mockId = - 1
            m.__mockTargetId = - 1
            m.mocks = {}
        end if
        fake = invalid
        if not target.doesExist("__rooibosTargetId") then
            m.__mockTargetId++
            target["__rooibosTargetId"] = m.__mockTargetId
        end if
        for i = 0 to m.__mockId
            id = stri(i).trim()
            mock = m.mocks[id]
            if mock <> invalid and mock.methodName = methodName and mock.target.__rooibosTargetId = target.__rooibosTargetId then
                fake = mock
                fake.lineNumbers.push(lineNumber)
                exit for
            end if
        end for
        if fake = invalid then
            m.__mockId++
            id = stri(m.__mockId).trim()
            if (m.__mockId > 25) then
                print "ERROR ONLY 25 MOCKS PER TEST ARE SUPPORTED!! you're on # " ; m.__mockId
                print " Method was " ; methodName
                return invalid
            end if
            fake = m.createFake(id, target, methodName, expectedInvocations, expectedArgs, returnValue, lineNumber)
            m.mocks[id] = fake 'this will bind it to m
            allowNonExisting = m.allowNonExistingMethodsOnMocks = true or allowNonExistingMethods
            isMethodPresent = type(target[methodName]) = "Function" or type(target[methodName]) = "roFunction"
            if (isMethodPresent or allowNonExisting) then
                target[methodName] = m["MockCallback" + id]
                target.__mocks = m.mocks
                if (not isMethodPresent) then
                    print "WARNING - mocking call " ; methodName ; " which did not exist on target object"
                end if
            else
                print "ERROR - could not create Mock : method not found  " ; target ; "." ; methodName
            end if
        else
            m.combineFakes(fake, m.createFake(id, target, methodName, expectedInvocations, expectedArgs, returnValue, lineNumber))
        end if
        return fake
    end function
    instance.createFake = function(id, target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, lineNumber = - 1) as object
        expectedArgsValues = []
        hasArgs = Rooibos_Common_isArray(expectedArgs)
        if (hasArgs) then
            defaultValue = m.invalidValue
        else
            defaultValue = m.ignoreValue
            expectedArgs = []
        end if
        lineNumbers = [
            lineNumber
        ]
        for i = 0 to 9
            if (hasArgs and expectedArgs.count() > i) then
                value = expectedArgs[i]
                if not Rooibos_Common_isUndefined(value) then
                    if Rooibos_Common_isAssociativeArray(value) and Rooibos_Common_isValid(value.matcher) then
                        if not Rooibos_Common_isFunction(value.matcher) then
                            print "[ERROR] you have specified a matching function; but it is not in scope!"
                            expectedArgsValues.push("#ERR-OUT_OF_SCOPE_MATCHER!")
                        else
                            expectedArgsValues.push(expectedArgs[i])
                        end if
                    else
                        expectedArgsValues.push(expectedArgs[i])
                    end if
                else
                    expectedArgsValues.push("#ERR-UNDEFINED!")
                end if
            else
                expectedArgsValues.push(defaultValue)
            end if
        end for
        fake = {
            id: id,
            target: target,
            methodName: methodName,
            returnValue: returnValue,
            lineNumbers: lineNumbers,
            isCalled: false,
            invocations: 0,
            invokedArgs: [
                invalid,
                invalid,
                invalid,
                invalid,
                invalid,
                invalid,
                invalid,
                invalid,
                invalid
            ],
            expectedArgs: expectedArgsValues,
            expectedInvocations: expectedInvocations,
            callback: function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
                if (m.allInvokedArgs = invalid) then
                    m.allInvokedArgs = []
                end if
                m.invokedArgs = [
                    arg1,
                    arg2,
                    arg3,
                    arg4,
                    arg5,
                    arg6,
                    arg7,
                    arg8,
                    arg9
                ]
                m.allInvokedArgs.push([
                    arg1,
                    arg2,
                    arg3,
                    arg4,
                    arg5,
                    arg6,
                    arg7,
                    arg8,
                    arg9
                ])
                m.isCalled = true
                m.invocations++
                if (type(m.returnValue) = "roAssociativeArray" and m.returnValue.doesExist("multiResult")) then
                    returnValues = m.returnValue["multiResult"]
                    returnIndex = m.invocations - 1
                    if (type(returnValues) = "roArray" and returnValues.count() > 0) then
                        if returnValues.count() <= m.invocations then
                            returnIndex = returnValues.count() - 1
                            print "Multi return values all used up - repeating last value"
                        end if
                        return returnValues[returnIndex]
                    else
                        print "Multi return value was specified; but no array of results were found"
                        return invalid
                    end if
                else
                    return m.returnValue
                end if
            end function
        }
        return fake
    end function
    instance.combineFakes = function(fake, otherFake)
        if type(fake.expectedArgs) <> "roAssociativeArray" or not fake.expectedArgs.doesExist("multiInvoke") then
            currentExpectedArgsArgs = fake.expectedArgs
            fake.expectedArgs = {
                "multiInvoke": [
                    currentExpectedArgsArgs
                ]
            }
        end if
        fake.expectedArgs.multiInvoke.push(otherFake.expectedArgs)
        if type(fake.returnValue) <> "roAssociativeArray" or not fake.returnValue.doesExist("multiResult") then
            currentReturnValue = fake.returnValue
            fake.returnValue = {
                "multiResult": [
                    currentReturnValue
                ]
            }
        end if
        fake.returnValue.multiResult.push(otherFake.returnValue)
        fake.lineNumbers.push(lineNumber)
        fake.expectedInvocations++
    end function
    instance.assertMocks = function() as void
        if (m.__mockId = invalid or not Rooibos_Common_isAssociativeArray(m.mocks)) then
            return
        end if
        lastId = int(m.__mockId)
        for each id in m.mocks
            mock = m.mocks[id]
            methodName = mock.methodName
            if (mock.expectedInvocations <> mock.invocations) then
                m.mockFail(mock.lineNumbers[0], methodName, "Wrong number of calls. (" + stri(mock.invocations).trim() + " / " + stri(mock.expectedInvocations).trim() + ")")
                m.cleanMocks()
                return
            else if mock.expectedInvocations > 0 and (Rooibos_Common_isArray(mock.expectedArgs) or (type(mock.expectedArgs) = "roAssociativeArray" and Rooibos_Common_isArray(mock.expectedArgs.multiInvoke))) then
                isMultiArgsSupported = type(mock.expectedArgs) = "roAssociativeArray" and Rooibos_Common_isArray(mock.expectedArgs.multiInvoke)
                for invocationIndex = 0 to mock.invocations - 1
                    invokedArgs = mock.allInvokedArgs[invocationIndex]
                    if isMultiArgsSupported then
                        expectedArgs = mock.expectedArgs.multiInvoke[invocationIndex]
                    else
                        expectedArgs = mock.expectedArgs
                    end if
                    for i = 0 to expectedArgs.count() - 1
                        value = invokedArgs[i]
                        expected = expectedArgs[i]
                        didNotExpectArg = Rooibos_Common_isString(expected) and expected = m.invalidValue
                        if (didNotExpectArg) then
                            expected = invalid
                        end if
                        isUsingMatcher = Rooibos_Common_isAssociativeArray(expected) and Rooibos_Common_isFunction(expected.matcher)
                        if isUsingMatcher then
                            if not expected.matcher(value) then
                                m.mockFail(mock.lineNumbers[invocationIndex], methodName, "on Invocation #" + stri(invocationIndex).trim() + ", expected arg #" + stri(i).trim() + "  to match matching function '" + Rooibos_Common_asString(expected.matcher) + "' got '" + Rooibos_Common_asString(value) + "')")
                                m.cleanMocks()
                            end if
                        else
                            if (not (Rooibos_Common_isString(expected) and expected = m.ignoreValue) and not Rooibos_Common_eqValues(value, expected)) then
                                if (expected = invalid) then
                                    expected = "[INVALID]"
                                end if
                                m.mockFail(mock.lineNumbers[invocationIndex], methodName, "on Invocation #" + stri(invocationIndex).trim() + ", expected arg #" + stri(i).trim() + "  to be '" + Rooibos_Common_asString(expected) + "' got '" + Rooibos_Common_asString(value) + "')")
                                m.cleanMocks()
                                return
                            end if
                        end if
                    end for
                end for
            end if
        end for
        m.cleanMocks()
    end function
    instance.cleanMocks = function() as void
        if m.mocks = invalid then
            return
        end if
        for each id in m.mocks
            mock = m.mocks[id]
            mock.target.__mocks = invalid
        end for
        m.mocks = invalid
    end function
    instance.cleanStubs = function() as void
        if m.stubs = invalid then
            return
        end if
        for each id in m.stubs
            stub = m.stubs[id]
            stub.target.__stubs = invalid
        end for
        m.stubs = invalid
    end function
    instance.mockFail = function(lineNumber, methodName, message) as dynamic
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        m.currentResult.addMockResult(lineNumber, "mock failure on '" + methodName + "' : " + message)
        return m.getLegacyCompatibleReturnValue(false)
    end function
    instance.stubCallback0 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["0"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.stubCallback1 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["1"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.stubCallback2 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["2"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.stubCallback3 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["3"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.stubCallback4 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["4"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.stubCallback5 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__Stubs["5"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback0 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["0"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback1 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["1"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback2 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["2"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback3 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["3"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback4 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["4"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback5 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["5"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback6 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["6"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback7 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["7"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback8 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["8"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback9 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["9"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback10 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["10"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback11 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["11"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback12 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["12"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback13 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["13"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback14 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["14"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback15 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["15"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback16 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["16"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback17 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["17"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback18 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["18"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback19 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["19"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback20 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["20"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback21 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["21"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback22 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["22"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback23 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["23"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.mockCallback24 = function(arg1 = invalid, arg2 = invalid, arg3 = invalid, arg4 = invalid, arg5 = invalid, arg6 = invalid, arg7 = invalid, arg8 = invalid, arg9 = invalid) as dynamic
        fake = m.__mocks["24"]
        return fake.callback(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9)
    end function
    instance.pathAsArray_ = function(path)
        pathRE = CreateObject("roRegex", "\[([0-9]+)\]", "i")
        segments = []
        if type(path) = "String" or type(path) = "roString" then
            dottedPath = pathRE.replaceAll(path, ".\1")
            stringSegments = dottedPath.tokenize(".")
            for each s in stringSegments
                if (Asc(s) >= 48) and (Asc(s) <= 57) then
                    segments.push(s.toInt())
                else
                    segments.push(s)
                end if
            end for
        else if type(path) = "roList" or type(path) = "roArray" then
            stringPath = ""
            for each s in path
                stringPath = stringPath + "." + Box(s).toStr()
            end for
            segments = m.pathAsArray_(stringPath)
        else
            segments = invalid
        end if
        return segments
    end function
    instance.g = function(aa, path, default = invalid)
        if type(aa) <> "roAssociativeArray" and type(aa) <> "roArray" and type(aa) <> "roSGNode" then
            return default
        end if
        segments = m.pathAsArray_(path)
        if (Type(path) = "roInt" or Type(path) = "roInteger" or Type(path) = "Integer") then
            path = stri(path).trim()
        end if
        if segments = invalid then
            return default
        end if
        result = invalid
        while segments.count() > 0
            key = segments.shift()
            if (type(key) = "roInteger") then 'it's a valid index
                if (aa <> invalid and GetInterface(aa, "ifArray") <> invalid) then
                    value = aa[key]
                else if (aa <> invalid and GetInterface(aa, "ifSGNodeChildren") <> invalid) then
                    value = aa.getChild(key)
                else if (aa <> invalid and GetInterface(aa, "ifAssociativeArray") <> invalid) then
                    key = str(key)
                    if not aa.doesExist(key) then
                        exit while
                    end if
                    value = aa.lookup(key)
                else
                    value = invalid
                end if
            else
                if not aa.doesExist(key) then
                    exit while
                end if
                value = aa.lookup(key)
            end if
            if segments.count() = 0 then
                result = value
                exit while
            end if
            if type(value) <> "roAssociativeArray" and type(value) <> "roArray" and type(value) <> "roSGNode" then
                exit while
            end if
            aa = value
        end while
        if result = invalid then
            return default
        end if
        return result
    end function
    instance.waitForField = function(target, fieldName, delay = 500, maxAttempts = 10)
        attempts = 0
        if target = invalid then
            return false
        end if
        initialValue = target[fieldName]
        while target[fieldName] = initialValue
            port = CreateObject("roMessagePort")
            wait(delay, port)
            attempts++
            if attempts = maxAttempts then
                return false
            end if
            print "waiting for signal field '" ; fieldName ; "' - " ; attempts
        end while
        return true
    end function
    instance.assertAsyncField = function(target, fieldName, delay = 500, maxAttempts = 10)
        if m.currentResult.isFail then
            return m.getLegacyCompatibleReturnValue(false)
        end if
        if target = invalid then
            m.fail("Target was invalid")
        end if
        result = m.waitForField(target, fieldName, delay, maxAttempts)
        if not result then
            return m.fail("Timeout waiting for targetField " + fieldName + " to be set on target")
        end if
        m.currentResult.addResult("")
        return m.getLegacyCompatibleReturnValue(true)
    end function
    return instance
end function
function Rooibos_BaseTestSuite()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.new()
    return instance
end function
function Rooibos_Common_isXmlElement(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifXMLElement") <> invalid
end function
function Rooibos_Common_isFunction(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifFunction") <> invalid
end function
function Rooibos_Common_getFunction(filename, functionName) as object
    if (not Rooibos_Common_isNotEmptyString(functionName)) then
        return invalid
    end if
    if (not Rooibos_Common_isNotEmptyString(filename)) then
        return invalid
    end if
    'bs:disable-next-line
    mapFunction = RBSFM_getFunctionsForFile(filename)
    if mapFunction <> invalid then
        map = mapFunction()
        if (type(map) = "roAssociativeArray") then
            functionPointer = map[functionName]
            return functionPointer
        else
            return invalid
        end if
    end if
    return invalid
end function
function Rooibos_Common_getFunctionBruteForce(functionName) as object
    if (not Rooibos_Common_isNotEmptyString(functionName)) then
        return invalid
    end if
    'bs:disable-next-line
    filenames = RBSFM_getFilenames()
    for i = 0 to filenames.count() - 1
        filename = filenames[i]
        'bs:disable-next-line
        mapFunction = RBSFM_getFunctionsForFile(filename)
        if mapFunction <> invalid then
            map = mapFunction()
            if (type(map) = "roAssociativeArray") then
                functionPointer = map[functionName]
                if functionPointer <> invalid then
                    return functionPointer
                end if
            end if
        end if
    end for
    return invalid
end function
function Rooibos_Common_isBoolean(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifBoolean") <> invalid
end function
function Rooibos_Common_isInteger(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifInt") <> invalid and (Type(value) = "roInt" or Type(value) = "roInteger" or Type(value) = "Integer")
end function
function Rooibos_Common_isFloat(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifFloat") <> invalid
end function
function Rooibos_Common_isDouble(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifDouble") <> invalid
end function
function Rooibos_Common_isLongInteger(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifLongInt") <> invalid
end function
function Rooibos_Common_isNumber(value) as boolean
    return Rooibos_Common_isLongInteger(value) or Rooibos_Common_isDouble(value) or Rooibos_Common_isInteger(value) or Rooibos_Common_isFloat(value)
end function
function Rooibos_Common_isList(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifList") <> invalid
end function
function Rooibos_Common_isArray(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifArray") <> invalid
end function
function Rooibos_Common_isAssociativeArray(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifAssociativeArray") <> invalid
end function
function Rooibos_Common_isSGNode(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifSGNodeChildren") <> invalid
end function
function Rooibos_Common_isString(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifString") <> invalid
end function
function Rooibos_Common_isNotEmptyString(value) as boolean
    return Rooibos_Common_isString(value) and len(value) > 0
end function
function Rooibos_Common_isDateTime(value) as boolean
    return Rooibos_Common_isValid(value) and (GetInterface(value, "ifDateTime") <> invalid or Type(value) = "roDateTime")
end function
function Rooibos_Common_isValid(value) as boolean
    return not Rooibos_Common_isUndefined(value) and value <> invalid
end function
function Rooibos_Common_isUndefined(value) as boolean
    return type(value) = "" or Type(value) = "<uninitialized>"
end function
function Rooibos_Common_validStr(obj) as string
    if obj <> invalid and GetInterface(obj, "ifString") <> invalid then
        return obj
    else
        return ""
    end if
end function
function Rooibos_Common_asString(input) as string
    if Rooibos_Common_isValid(input) = false then
        return "Invalid"
    else if Rooibos_Common_isString(input) then
        return input
    else if Rooibos_Common_isInteger(input) or Rooibos_Common_isLongInteger(input) or Rooibos_Common_isBoolean(input) then
        return input.ToStr()
    else if Rooibos_Common_isFloat(input) or Rooibos_Common_isDouble(input) then
        return Str(input).Trim()
    else if type(input) = "roSGNode" then
        return "Node(" + input.subType() + ")"
    else if type(input) = "roAssociativeArray" then
        isFirst = true
        text = "{"
        if (not isFirst) then
            text = text + ","
            isFirst = false
        end if
        for each key in input
            if key <> "__mocks" and key <> "__stubs" then
                text = text + key + ":" + Rooibos_Common_asString(input[key])
            end if
        end for
        text = text + "}"
        return text
    else if Rooibos_Common_isFunction(input) then
        return input.toStr()
    else
        return ""
    end if
end function
function Rooibos_Common_asInteger(input) as integer
    if Rooibos_Common_isValid(input) = false then
        return 0
    else if Rooibos_Common_isString(input) then
        return input.ToInt()
    else if Rooibos_Common_isInteger(input) then
        return input
    else if Rooibos_Common_isFloat(input) or Rooibos_Common_isDouble(input) or Rooibos_Common_isLongInteger(input) then
        return Int(input)
    else
        return 0
    end if
end function
function Rooibos_Common_asLongInteger(input) as longinteger
    if Rooibos_Common_isValid(input) = false then
        return 0
    else if Rooibos_Common_isString(input) then
        return Rooibos_Common_asInteger(input)
    else if Rooibos_Common_isLongInteger(input) or Rooibos_Common_isFloat(input) or Rooibos_Common_isDouble(input) or Rooibos_Common_isInteger(input) then
        return input
    else
        return 0
    end if
end function
function Rooibos_Common_asFloat(input) as float
    if Rooibos_Common_isValid(input) = false then
        return 0
    else if Rooibos_Common_isString(input) then
        return input.ToFloat()
    else if Rooibos_Common_isInteger(input) then
        return (input / 1)
    else if Rooibos_Common_isFloat(input) or Rooibos_Common_isDouble(input) or Rooibos_Common_isLongInteger(input) then
        return input
    else
        return 0
    end if
end function
function Rooibos_Common_asDouble(input) as double
    if Rooibos_Common_isValid(input) = false then
        return 0
    else if Rooibos_Common_isString(input) then
        return Rooibos_Common_asFloat(input)
    else if Rooibos_Common_isInteger(input) or Rooibos_Common_isLongInteger(input) or Rooibos_Common_isFloat(input) or Rooibos_Common_isDouble(input) then
        return input
    else
        return 0
    end if
end function
function Rooibos_Common_asBoolean(input) as boolean
    if Rooibos_Common_isValid(input) = false then
        return false
    else if Rooibos_Common_isString(input) then
        return LCase(input) = "true"
    else if Rooibos_Common_isInteger(input) or Rooibos_Common_isFloat(input) then
        return input <> 0
    else if Rooibos_Common_isBoolean(input) then
        return input
    else
        return false
    end if
end function
function Rooibos_Common_asArray(value) as object
    if Rooibos_Common_isValid(value) then
        if not Rooibos_Common_isArray(value) then
            return [
                value
            ]
        else
            return value
        end if
    end if
    return []
end function
function Rooibos_Common_isNullOrEmpty(value) as boolean
    if Rooibos_Common_isString(value) then
        return Len(value) = 0
    else
        return not Rooibos_Common_isValid(value)
    end if
end function
function Rooibos_Common_findElementIndexInArray(array, value, compareAttribute = invalid, caseSensitive = false) as integer
    if Rooibos_Common_isArray(array) then
        for i = 0 to Rooibos_Common_asArray(array).Count() - 1
            compareValue = array[i]
            if compareAttribute <> invalid and Rooibos_Common_isAssociativeArray(compareValue) then
                compareValue = compareValue.lookupCI(compareAttribute)
            end if
            if Rooibos_Common_eqValues(compareValue, value) then
                return i
            end if
            item = array[i]
        end for
    end if
    return - 1
end function
function Rooibos_Common_arrayContains(array, value, compareAttribute = invalid) as boolean
    return (Rooibos_Common_findElementIndexInArray(array, value, compareAttribute) > - 1)
end function
function Rooibos_Common_findElementIndexInNode(node, value) as integer
    if type(node) = "roSGNode" then
        for i = 0 to node.getChildCount() - 1
            compareValue = node.getChild(i)
            if type(compareValue) = "roSGNode" and compareValue.isSameNode(value) then
                return i
            end if
        end for
    end if
    return - 1
end function
function Rooibos_Common_nodeContains(node, value) as boolean
    return (Rooibos_Common_findElementIndexInNode(node, value) > - 1)
end function
function Rooibos_Common_eqValues(Value1, Value2) as dynamic
    val1Type = type(Value1)
    val2Type = type(Value2)
    if val1Type = "<uninitialized>" or val2Type = "<uninitialized>" or val1Type = "" or val2Type = "" then
        print "ERROR!!!! - undefined value passed"
        return false
    end if
    if val1Type = "roString" or val1Type = "String" then
        Value1 = Rooibos_Common_asString(Value1)
    else
        Value1 = box(Value1)
    end if
    if val2Type = "roString" or val2Type = "String" then
        Value2 = Rooibos_Common_asString(Value2)
    else
        Value2 = box(Value2)
    end if
    val1Type = type(Value1)
    val2Type = type(Value2)
    if val1Type = "roFloat" and val2Type = "roInt" then
        Value2 = box(Cdbl(Value2))
    else if val2Type = "roFloat" and val1Type = "roInt" then
        Value1 = box(Cdbl(Value1))
    end if
    if val1Type <> val2Type then
        return false
    else
        valtype = val1Type
        if valtype = "roList" then
            return Rooibos_Common_eqArray(Value1, Value2)
        else if valtype = "roAssociativeArray" then
            return Rooibos_Common_eqAssocArray(Value1, Value2)
        else if valtype = "roArray" then
            return Rooibos_Common_eqArray(Value1, Value2)
        else if (valtype = "roSGNode") then
            if (val2Type <> "roSGNode") then
                return false
            else
                return Value1.isSameNode(Value2)
            end if
        else 'If you crashed on this line, then you're trying to compare
            return Value1 = Value2
        end if
    end if
end function
function Rooibos_Common_eqAssocArray(Value1, Value2) as dynamic
    l1 = Value1.Count()
    l2 = Value2.Count()
    if not l1 = l2 then
        return false
    else
        for each k in Value1
            if k <> "__mocks" and k <> "__stubs" then 'fix infinite loop/box crash when doing equals on an aa with a mock
                if not Value2.DoesExist(k) then
                    return false
                else
                    v1 = Value1[k]
                    v2 = Value2[k]
                    if not Rooibos_Common_eqValues(v1, v2) then
                        return false
                    end if
                end if
            end if
        end for
        return true
    end if
end function
function Rooibos_Common_eqArray(Value1, Value2) as dynamic
    if not (Rooibos_Common_isArray(Value1)) or not Rooibos_Common_isArray(Value2) then
        return false
    end if
    l1 = Value1.Count()
    l2 = Value2.Count()
    if not l1 = l2 then
        return false
    else
        for i = 0 to l1 - 1
            v1 = Value1[i]
            v2 = Value2[i]
            if not Rooibos_Common_eqValues(v1, v2) then
                return false
            end if
        end for
        return true
    end if
end function
function Rooibos_Common_fillText(text as string, fillChar = " ", numChars = 40) as string
    if (len(text) >= numChars) then
        text = left(text, numChars - 5) + "..." + fillChar + fillChar
    else
        numToFill = numChars - len(text) - 1
        for i = 0 to numToFill
            text = text + fillChar
        end for
    end if
    return text
end function
function Rooibos_Common_getAssertLine(testCase, index)
    if (testCase.assertLineNumberMap.doesExist(stri(index).trim())) then
        return testCase.assertLineNumberMap[stri(index).trim()]
    else if (testCase.assertLineNumberMap.doesExist(stri(index + 1000).trim())) then 'this is where we store line numbers for our
        return testCase.assertLineNumberMap[stri(index + 1000).trim()]
        return testCase.lineNumber
    end if
end function
function Rooibos_Coverage_createLCovOutput()
    print "Generating lcov.info file..."
    cc = m.global._rbs_ccn
    expectedMap = cc.expectedMap
    filePathMap = cc.filePathMap
    resolvedMap = cc.resolvedMap
    buffer = ""
    for each module in filePathMap.items()
        moduleNumber = module.key
        filePath = module.value
        packageName = "."
        relativePath = filePath.replace("pkg:", packageName)
        sanitizedPath = relativePath.replace("\\", "/")
        buffer = buffer + "TN:" + chr(10)
        buffer = buffer + "SF:" + sanitizedPath + chr(10)
        for each expected in expectedMap[moduleNumber]
            lineNumber = expected[0]
            SHIFT = 1
            if (resolvedMap[moduleNumber] <> invalid) and resolvedMap[moduleNumber].doesExist(str(lineNumber)) then
                buffer = buffer + "DA:" + str(lineNumber + SHIFT) + ",1" + chr(10)
            else
                buffer = buffer + "DA:" + str(lineNumber + SHIFT) + ",0" + chr(10)
            end if
        end for
        buffer = buffer + "end_of_record" + chr(10)
    end for
    return buffer
end function
function Rooibos_Coverage_printLCovInfo()
    print ""
    print "+++++++++++++++++++++++++++++++++++++++++++"
    print "LCOV.INFO FILE"
    print "+++++++++++++++++++++++++++++++++++++++++++"
    print ""
    print "+-=-coverage:start"
    print Rooibos_Coverage_createLCovOutput()
    print "+-=-coverage:end"
end function
function Rooibos_ItGroup_getTestCases(group) as object
    if (group.hasSoloTests = true) then
        return group.soloTestCases
    else
        return group.testCases
    end if
end function
function Rooibos_ItGroup_getRunnableTestSuite(group) as object
    testCases = Rooibos_ItGroup_getTestCases(group)
    runnableSuite = Rooibos_BaseTestSuite()
    runnableSuite.name = group.name
    runnableSuite.isLegacy = group.isLegacy = true
    if group.testCaseLookup = invalid then
        group.testCaseLookup = {}
    end if
    for each testCase in testCases
        name = testCase.name
        if (testCase.isSolo = true) then
            name = name + " [SOLO] "
        end if
        testFunction = Rooibos_Common_getFunction(group.filename, testCase.funcName)
        runnableSuite.addTest(name, testFunction, testCase.funcName)
        group.testCaseLookup[name] = testCase
    end for
    runnableSuite.SetUp = Rooibos_Common_getFunction(group.filename, group.setupFunctionName)
    runnableSuite.TearDown = Rooibos_Common_getFunction(group.filename, group.teardownFunctionName)
    runnableSuite.BeforeEach = Rooibos_Common_getFunction(group.filename, group.beforeEachFunctionName)
    runnableSuite.AfterEach = Rooibos_Common_getFunction(group.filename, group.afterEachFunctionName)
    return runnableSuite
end function
function __Rooibos_ItemGenerator_builder()
    instance = {}
    instance.new = function()
        m.isValid = Rooibos_Common_isValid(scheme)
    end function
    instance.GetItem = function(scheme as object) as object
        item = invalid
        if Rooibos_Common_isAssociativeArray(scheme) then
            item = m.getAssocArray(scheme)
        else if Rooibos_Common_isArray(scheme) then
            item = m.getArray(scheme)
        else if Rooibos_Common_isString(scheme) then
            item = m.getSimpleType(lCase(scheme))
        end if
        return item
    end function
    instance.GetAssocArray = function(scheme as object) as object
        item = {}
        for each key in scheme
            if not item.DoesExist(key) then
                item[key] = m.getItem(scheme[key])
            end if
        end for
        return item
    end function
    instance.GetArray = function(scheme as object) as object
        item = []
        for each key in scheme
            item.Push(m.getItem(key))
        end for
        return item
    end function
    instance.GetSimpleType = function(typeStr as string) as object
        item = invalid
        if typeStr = "integer" or typeStr = "int" or typeStr = "roint" then
            item = m.getInteger()
        else if typeStr = "float" or typeStr = "rofloat" then
            item = m.getFloat()
        else if typeStr = "string" or typeStr = "rostring" then
            item = m.getString(10)
        else if typeStr = "boolean" or typeStr = "roboolean" then
            item = m.getBoolean()
        end if
        return item
    end function
    instance.GetBoolean = function() as boolean
        return Rooibos_Common_asBoolean(Rnd(2) \ Rnd(2))
    end function
    instance.GetInteger = function(seed = 100) as integer
        return Rnd(seed)
    end function
    instance.GetFloat = function() as float
        return Rnd(0)
    end function
    instance.GetString = function(seed as integer) as string
        item = ""
        if seed > 0 then
            stringLength = Rnd(seed)
            for i = 0 to stringLength
                chType = Rnd(3)
                if chType = 1 then 'Chr(48-57) - numbers
                    chNumber = 47 + Rnd(10)
                else if chType = 2 then 'Chr(65-90) - Uppercase Letters
                    chNumber = 64 + Rnd(26)
                else 'Chr(97-122) - Lowercase Letters
                    chNumber = 96 + Rnd(26)
                end if
                item = item + Chr(chNumber)
            end for
        end if
        return item
    end function
    return instance
end function
function Rooibos_ItemGenerator()
    instance = __Rooibos_ItemGenerator_builder()
    instance.new()
    return instance
end function
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
function Rooibos_RunNodeTests(args) as object
    print " RUNNING NODE TESTS"
    totalStatObj = Rooibos_Stats_CreateTotalStatistic()
    Rooibos_TestRunnerMixin_RunItGroups(args.metaTestSuite, totalStatObj, args.testUtilsDecoratorMethodName, args.config, args.runtimeConfig, m)
    return totalStatObj
end function
function Rooibos_CreateTestNode(nodeType) as object
    node = createObject("roSGNode", nodeType)
    if (type(node) = "roSGNode" and node.subType() = nodeType) then
        m.top.AppendChild(node)
        return node
    else
        print " Error creating test node of type " ; nodeType
        return invalid
    end if
end function
function Rooibos_init(preTestSetup = invalid, testUtilsDecoratorMethodName = invalid, testSceneName = invalid, nodeContext = invalid) as void
    args = {}
    if createObject("roAPPInfo").IsDev() <> true then
        print " not running in dev mode! - rooibos tests only support sideloaded builds - aborting"
        return
    end if
    args.testUtilsDecoratorMethodName = testUtilsDecoratorMethodName
    args.nodeContext = nodeContext
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    if testSceneName = invalid then
        testSceneName = "TestsScene"
    end if
    print "Starting test using test scene with name TestsScene" ; testSceneName
    scene = screen.CreateScene(testSceneName)
    scene.id = "ROOT"
    screen.show()
    m.global = screen.getGlobalNode()
    m.global.addFields({
        "testsScene": scene
    })
    if (preTestSetup <> invalid) then
        preTestSetup(screen)
    end if
    testId = args.TestId
    if (testId = invalid) then
        testId = "UNDEFINED_TEST_ID"
    end if
    print "#########################################################################"
    print "#TEST START : ###" ; testId ; "###"
    args.testScene = scene
    args.global = m.global
    rooibosVersion = "4.0.0"
    requiredRooibosPreprocessorVersion = "1.0.0"
    if not Rooibos_Common_isFunction(RBSFM_getPreprocessorVersion) then
        versionError = "You are using a rooibos-preprocessor (i.e. rooibos-cli) version older than 1.0.0 - please update to " + requiredRooibosPreprocessorVersion
    else 'bs:disable-next-line
        if Rooibos_versionCompare(RBSFM_getPreprocessorVersion(), requiredRooibosPreprocessorVersion) >= 0 then
            versionError = ""
        else 'bs:disable-next-line
            versionError = "Your rooibos-preprocessor (i.e. rooibos-cli) version '" + RBSFM_getPreprocessorVersion() + "' is not compatible with rooibos version " + rooibosVersion + ". Please upgrade your rooibos-cli to version " + requiredRooibosPreprocessorVersion
        end if
    end if
    if versionError = "" then
        print "######################################################"
        print ""
        print "# rooibos framework version: " ; rooibosVersion
        'bs:disable-next-line
        print "# tests parsed with rooibosC version: " ; RBSFM_getPreprocessorVersion()
        print "######################################################"
        print ""
        if scene.hasField("isReadyToStartTests") and scene.isReadyToStartTests = false then
            print "The scene is not ready yet - waiting for it to set isReadyToStartTests to true"
            scene.observeField("isReadyToStartTests", m.port)
        else
            print "scene is ready; running tests now"
            runner = Rooibos_TestRunner(args)
            runner.Run()
        end if
        while (true)
            msg = wait(0, m.port)
            msgType = type(msg)
            if msgType = "roSGScreenEvent" then
                if msg.isScreenClosed() then
                    return
                end if
            else if msgType = "roSGNodeEvent" then
                if msg.getField() = "isReadyToStartTests" and msg.getData() = true then
                    print "scene is ready; running tests now"
                    runner = Rooibos_TestRunner(args)
                    runner.Run()
                end if
            end if
        end while
    else
        print ""
        print "#########################################################"
        print "ERROR - VERSION MISMATCH"
        print versionError
        print "#########################################################"
    end if
end function
function Rooibos_versionCompare(v1, v2)
    v1parts = v1.split(".")
    v2parts = v2.split(".")
    while v1parts.count() < v2parts.count()
        v1parts.push("0")
    end while
    while v2parts.count() < v1parts.count()
        v2parts.push("0")
    end while
    for i = 0 to v1parts.count() - 1
        if (v2parts.count() = i) then
            return 1
        end if
        if (v1parts[i] <> v2parts[i]) then
            if (v1parts[i] > v2parts[i]) then
                return 1
            else
                return - 1
            end if
        end if
    end for
    if (v1parts.count() <> v2parts.count()) then
        return - 1
    end if
    return 0
end function
function __Rooibos_UnitTestRuntimeConfig_builder()
    instance = {}
    instance.new = function()
        m.hasSoloSuites = false
        m.hasSoloGroups = false
        m.hasSoloTests = false
        m.suites = m.CreateSuites()
    end function
    instance.createSuites = function()
        'bs:disable-next-line
        suites = RBSFM_getTestSuitesForProject()
        includedSuites = []
        for i = 0 to suites.count() - 1
            suite = suites[i]
            if (suite.valid) then
                if (suite.isSolo) then
                    m.hasSoloSuites = true
                end if
                if (suite.hasSoloTests = true) then
                    m.hasSoloTests = true
                end if
                if (suite.hasSoloGroups = true) then
                    m.hasSoloGroups = true
                end if
                includedSuites.push(suite)
            else
                print "ERROR! suite was not valid - ignoring"
            end if
        end for
        return includedSuites
    end function
    return instance
end function
function Rooibos_UnitTestRuntimeConfig()
    instance = __Rooibos_UnitTestRuntimeConfig_builder()
    instance.new()
    return instance
end function
function __Rooibos_Socket_builder()
    instance = {}
    instance.new = sub()
        m.socket = invalid
        m.connection = invalid
    end sub
    instance.CreateSocketAndWaitConnection = function(port) as void
        messagePort = CreateObject("roMessagePort")
        m.socket = CreateObject("roStreamSocket")
        m.socket.setMessagePort(messagePort)
        addr = CreateObject("roSocketAddress")
        addr.setPort(port)
        m.socket.setAddress(addr)
        m.socket.notifyReadable(true)
        x = m.socket.listen(1)
        if not m.socket.eOK() then
            print "[ERROR]: Could not create socket."
        end if
        print "[INFO]: Waiting for CI socket connection on port:" ; port
        while true
            msg = wait(0, messagePort)
            if type(msg) = "roSocketEvent" then
                changedID = msg.getSocketID()
                if m.socket.isReadable() then
                    newConnection = m.socket.accept()
                    if newConnection = invalid then
                        print "[ERROR]: Socket connection failed"
                    else
                        print "[INFO]: CI connected! Running tests.."
                        m.connection = newConnection
                        return
                    end if
                else
                    if closed or not newConnection.eOK() then
                        print "[WARN]: Closing connection on port:" ; port
                        newConnection.close()
                    end if
                end if
            end if
        end while
    end function
    instance.sendResults = function(totalStatObj as object) as void
        socketResultMsg = {
            success: false,
            testCount: 0,
            failedTests: 0,
            failedTestsNames: [],
            failedFiles: [],
            failureMessages: []
        }
        if totalStatObj.testRunHasFailures = false then
            socketResultMsg.success = true
        end if
        socketresultmsg.testCount = totalStatObj.total
        socketresultmsg.failedTests = totalStatObj.fail
        for each suite in totalStatObj.suites
            for each test in suite.tests
                if test.result = "Fail" then
                    errorStr = "Fail! Line " + test.metatestcase.lineNumber.toStr() + " of " + test.filePath + ", " + test.metatestcase.testResult.messages[0]
                    socketresultmsg.failureMessages.push(errorStr)
                    socketresultmsg.failedTestsNames.push(test.name)
                    socketresultmsg.failedFiles.push(test.filePath)
                end if
            end for
        end for
        m.connection.sendStr(formatJson(socketresultmsg))
    end function
    return instance
end function
function Rooibos_Socket()
    instance = __Rooibos_Socket_builder()
    instance.new()
    return instance
end function
function Rooibos_Stats_createTotalStatistic() as object
    statTotalItem = {
        Suites: [],
        Time: 0,
        Total: 0,
        Correct: 0,
        Fail: 0,
        Ignored: 0,
        Crash: 0,
        IgnoredTestNames: []
    }
    return statTotalItem
end function
function Rooibos_Stats_mergeTotalStatistic(stat1, stat2) as void
    for each suite in stat2.Suites
        stat1.Suites.push(suite)
    end for
    stat1.time = stat1.Time + stat2.Time
    stat1.total = stat1.Total + stat2.Total
    stat1.correct = stat1.Correct + stat2.Correct
    stat1.fail = stat1.Fail + stat2.Fail
    stat1.crash = stat1.Crash + stat2.Crash
    stat1.ignored = stat1.Ignored + stat2.Ignored
    stat1.ignoredTestNames.append(stat2.IgnoredTestNames)
end function
function Rooibos_Stats_createSuiteStatistic(name as string) as object
    statSuiteItem = {
        name: name,
        tests: [],
        time: 0,
        total: 0,
        correct: 0,
        fail: 0,
        crash: 0,
        ignored: 0,
        ignoredTestNames: []
    }
    return statSuiteItem
end function
function Rooibos_Stats_createTestStatistic(name, result = "Success", time = 0, errorCode = 0, errorMessage = "") as object
    statTestItem = {
        name: name,
        result: result,
        time: time,
        error: {
            code: errorCode,
            message: errorMessage
        }
    }
    return statTestItem
end function
sub Rooibos_Stats_AppendTestStatistic(statSuiteObj as object, statTestObj as object)
    if Rooibos_Common_IsAssociativeArray(statSuiteObj) and Rooibos_Common_IsAssociativeArray(statTestObj) then
        statSuiteObj.Tests.Push(statTestObj)
        if Rooibos_Common_IsInteger(statTestObj.time) then
            statSuiteObj.Time = statSuiteObj.Time + statTestObj.Time
        end if
        statSuiteObj.Total = statSuiteObj.Total + 1
        if lCase(statTestObj.Result) = "success" then
            statSuiteObj.Correct = statSuiteObj.Correct + 1
        else if lCase(statTestObj.result) = "fail" then
            statSuiteObj.Fail = statSuiteObj.Fail + 1
        else
            statSuiteObj.crash = statSuiteObj.crash + 1
        end if
    end if
end sub
sub Rooibos_Stats_AppendSuiteStatistic(statTotalObj as object, statSuiteObj as object)
    if Rooibos_Common_IsAssociativeArray(statTotalObj) and Rooibos_Common_IsAssociativeArray(statSuiteObj) then
        statTotalObj.Suites.Push(statSuiteObj)
        statTotalObj.Time = statTotalObj.Time + statSuiteObj.Time
        if Rooibos_Common_IsInteger(statSuiteObj.Total) then
            statTotalObj.Total = statTotalObj.Total + statSuiteObj.Total
        end if
        if Rooibos_Common_IsInteger(statSuiteObj.Correct) then
            statTotalObj.Correct = statTotalObj.Correct + statSuiteObj.Correct
        end if
        if Rooibos_Common_IsInteger(statSuiteObj.Fail) then
            statTotalObj.Fail = statTotalObj.Fail + statSuiteObj.Fail
        end if
        if Rooibos_Common_IsInteger(statSuiteObj.Crash) then
            statTotalObj.Crash = statTotalObj.Crash + statSuiteObj.Crash
        end if
    end if
end sub
function __Rooibos_UnitTestCase_builder()
    instance = {}
    instance.new = function(name as string, func as dynamic, funcName as string, isSolo as boolean, isIgnored as boolean, lineNumber as integer, params = invalid, paramTestIndex = 0, paramLineNumber = 0)
        m.isSolo = invalid
        m.func = invalid
        m.funcName = invalid
        m.isIgnored = invalid
        m.name = invalid
        m.lineNumber = invalid
        m.paramLineNumber = invalid
        m.assertIndex = 0
        m.assertLineNumberMap = {}
        m.getTestLineIndex = 0
        m.rawParams = invalid
        m.paramTestIndex = invalid
        m.isParamTest = false
        m.time = 0
        m.isSolo = isSolo
        m.func = func
        m.funcName = funcName
        m.isIgnored = isIgnored
        m.name = name
        m.lineNumber = lineNumber
        m.paramLineNumber = paramLineNumber
        m.rawParams = params
        m.paramTestIndex = paramTestIndex
        if (params <> invalid) then
            m.name = m.name + stri(m.paramTestIndex)
        end if
        return this
    end function
    return instance
end function
function Rooibos_UnitTestCase(name as string, func as dynamic, funcName as string, isSolo as boolean, isIgnored as boolean, lineNumber as integer, params = invalid, paramTestIndex = 0, paramLineNumber = 0)
    instance = __Rooibos_UnitTestCase_builder()
    instance.new(name, func, funcName, isSolo, isIgnored, lineNumber, params, paramTestIndex, paramLineNumber)
    return instance
end function
function __Rooibos_RLogger_builder()
    instance = {}
    instance.new = function(config)
        m.config = config
        m.verbosityLevel = {
            basic: 0,
            normal: 1,
            verbose: 2
        }
        m.verbosity = m.config.logLevel
    end function
    instance.printStatistic = sub(statObj as object)
        m.PrintStart()
        previousfile = invalid
        for each testSuite in statObj.Suites
            if (not statObj.testRunHasFailures or ((not m.config.showOnlyFailures) or testSuite.fail > 0 or testSuite.crash > 0)) then
                if (testSuite.metaTestSuite.filePath <> previousfile) then
                    m.PrintMetaSuiteStart(testSuite.metaTestSuite)
                    previousfile = testSuite.metaTestSuite.filePath
                end if
                m.PrintSuiteStatistic(testSuite, statObj.testRunHasFailures)
            end if
        end for
        print ""
        m.PrintEnd()
        'bs:disable-next-line
        ignoredInfo = RBSFM_getIgnoredTestInfo()
        print "Total  = " ; Rooibos_Common_AsString(statObj.Total) ; " ; Passed  = " ; statObj.Correct ; " ; Failed   = " ; statObj.Fail ; " ; Ignored   = " ; ignoredInfo.count
        print " Time spent: " ; statObj.Time ; "ms"
        print ""
        print ""
        if (ignoredInfo.count > 0) then
            print "IGNORED TESTS:"
            for each ignoredItemName in ignoredInfo.items
                print ignoredItemName
            end for
        end if
        if (statObj.ignored > 0) then
            print "IGNORED TESTS:"
            for each ignoredItemName in statObj.IgnoredTestNames
                print ignoredItemName
            end for
        end if
        if (statObj.Total = statObj.Correct) then
            overrallResult = "Success"
        else
            overrallResult = "Fail"
        end if
        print "RESULT: " ; overrallResult
    end sub
    instance.printSuiteStatistic = sub(statSuiteObj as object, hasFailures)
        m.PrintSuiteStart(statSuiteObj.Name)
        for each testCase in statSuiteObj.Tests
            if (not hasFailures or ((not m.config.showOnlyFailures) or testCase.Result <> "Success")) then
                m.PrintTestStatistic(testCase)
            end if
        end for
        print " |"
    end sub
    instance.printTestStatistic = sub(testCase as object)
        metaTestCase = testCase.metaTestCase
        if (LCase(testCase.Result) <> "success") then
            testChar = "-"
            if metaTestCase.testResult.failedMockLineNumber > - 1 then
                lineNumber = metaTestCase.testResult.failedMockLineNumber
            else
                assertIndex = metaTestCase.testResult.failedAssertIndex
                lineNumber = Rooibos_Common_getAssertLine(metaTestCase, assertIndex)
            end if
            if lineNumber <> invalid then
                locationLine = StrI(lineNumber).trim()
            else
                locationLine = StrI(metaTestCase.lineNumber).trim()
            end if
        else
            testChar = "|"
            locationLine = StrI(metaTestCase.lineNumber).trim()
        end if
        locationText = "pkg:/" + testCase.filePath.trim() + "(" + locationLine + ")"
        if m.config.printTestTimes = true then
            timeText = " (" + stri(metaTestCase.time).trim() + "ms)"
        else
            timeText = ""
        end if
        insetText = ""
        if (metaTestcase.isParamTest <> true) then
            messageLine = Rooibos_Common_fillText(" " + testChar + " |--" + metaTestCase.Name + " : ", ".", 80)
            print messageLine ; testCase.Result ; timeText
        else if (metaTestcase.paramTestIndex = 0) then
            name = metaTestCase.Name
            if (len(name) > 1 and right(name, 1) = "0") then
                name = left(name, len(name) - 1)
            end if
            print " " + testChar + " |--" + name + " : "
        end if
        if (metaTestcase.isParamTest = true) then
            insetText = "  "
            if type(metaTestCase.rawParams) = "roAssociativeArray" then
                rawParams = {}
                for each key in metaTestCase.rawParams
                    if type(metaTestCase.rawParams[key]) <> "Function" and type(metaTestCase.rawParams[key]) <> "roFunction" then
                        rawParams[key] = metaTestCase.rawParams[key]
                    end if
                end for
            else
                rawParams = metaTestCase.rawParams
            end if
            messageLine = Rooibos_Common_fillText(" " + testChar + insetText + " |--" + formatJson(rawParams) + " : ", ".", 80)
            print messageLine ; testCase.Result ; timeText
        end if
        if LCase(testCase.Result) <> "success" then
            print " | " ; insettext ; "  |--Location: " ; locationText
            if (metaTestcase.isParamTest = true) then
                print " | " ; insettext ; "  |--Param Line: " ; StrI(metaTestCase.paramlineNumber).trim()
            end if
            print " | " ; insettext ; "  |--Error Message: " ; testCase.Error.Message
        end if
    end sub
    instance.printStart = sub()
        print ""
        print "[START TEST REPORT]"
        print ""
    end sub
    instance.printEnd = sub()
        print ""
        print "[END TEST REPORT]"
        print ""
    end sub
    instance.printSuiteSetUp = sub(sName as string)
        if m.verbosity = m.verbosityLevel.verbose then
            print "================================================================="
            print "===   SetUp " ; sName ; " suite."
            print "================================================================="
        end if
    end sub
    instance.printMetaSuiteStart = sub(metaTestSuite)
        print metaTestSuite.name ; " " ; "pkg:/" ; metaTestSuite.filePath + "(1)"
    end sub
    instance.printSuiteStart = sub(sName as string)
        print " |-" ; sName
    end sub
    instance.printSuiteTearDown = sub(sName as string)
        if m.verbosity = m.verbosityLevel.verbose then
            print "================================================================="
            print "===   TearDown " ; sName ; " suite."
            print "================================================================="
        end if
    end sub
    instance.printTestSetUp = sub(tName as string)
        if m.verbosity = m.verbosityLevel.verbose then
            print "----------------------------------------------------------------"
            print "---   SetUp " ; tName ; " test."
            print "----------------------------------------------------------------"
        end if
    end sub
    instance.printTestTearDown = sub(tName as string)
        if m.verbosity = m.verbosityLevel.verbose then
            print "----------------------------------------------------------------"
            print "---   TearDown " ; tName ; " test."
            print "----------------------------------------------------------------"
        end if
    end sub
    return instance
end function
function Rooibos_RLogger(config)
    instance = __Rooibos_RLogger_builder()
    instance.new(config)
    return instance
end function
function __Rooibos_TestRunner_builder()
    instance = {}
    instance.new = function(args = {})
        m.RunItGroups = Rooibos_TestRunnerMixin_RunItGroups
        m.RunTestCases = Rooibos_TestRunnerMixin_RunTestCases
        m.testScene = args.testScene
        m.nodeContext = args.nodeContext
        'bs:disable-next-line
        config = RBSFM_getRuntimeConfig()
        if (config = invalid or not Rooibos_Common_isAssociativeArray(config)) then
            print "WARNING : specified config is invalid - using default"
            config = {
                showOnlyFailures: false,
                failFast: false
            }
        end if
        if (args.showOnlyFailures <> invalid) then
            config.showOnlyFailures = args.showOnlyFailures = "true"
        end if
        if (args.failFast <> invalid) then
            config.failFast = args.failFast = "true"
        end if
        m.testUtilsDecoratorMethodName = args.testUtilsDecoratorMethodName
        m.config = config
        if m.config.port <> invalid then
            m.socket = Rooibos_Socket()
            m.socket.CreateSocketAndWaitConnection(m.config.port)
        end if
        m.config.testsDirectory = config.testsDirectory
        m.logger = Rooibos_RLogger(m.config)
        m.global = args.global
    end function
    instance.run = sub()
        if type(RBSFM_getTestSuitesForProject) <> "Function" then
            print " ERROR! RBSFM_getTestSuitesForProject is not found! That looks like you didn't run the preprocessor as part of your test process. Please refer to the docs."
            return
        end if
        totalStatObj = Rooibos_Stats_createTotalStatistic()
        m.runtimeConfig = Rooibos_UnitTestRuntimeConfig()
        m.runtimeConfig.global = m.global
        totalStatObj.testRunHasFailures = false
        for each metaTestSuite in m.runtimeConfig.suites
            if (m.runtimeConfig.hasSoloTests = true) then
                if (metaTestSuite.hasSoloTests <> true) then
                    if (m.config.logLevel = 2) then
                        print "TestSuite " ; metaTestSuite.name ; " Is filtered because it has no solo tests"
                    end if
                    goto skipSuite
                end if
            else if (m.runtimeConfig.hasSoloSuites) then
                if (metaTestSuite.isSolo <> true) then
                    if (m.config.logLevel = 2) then
                        print "TestSuite " ; metaTestSuite.name ; " Is filtered due to solo flag"
                    end if
                    goto skipSuite
                end if
            end if
            if (metaTestSuite.isIgnored = true) then
                if (m.config.logLevel = 2) then
                    print "Ignoring TestSuite " ; metaTestSuite.name ; " Due to Ignore flag"
                end if
                totalstatobj.ignored++
                totalStatObj.IgnoredTestNames.push("|-" + metaTestSuite.name + " [WHOLE SUITE]")
                goto skipSuite
            end if
            print ""
            print Rooibos_Common_fillText("> SUITE: " + metaTestSuite.name, ">", 80)
            if (metaTestSuite.isNodeTest = true and metaTestSuite.nodeTestFileName <> "") then
                print " +++++RUNNING NODE TEST"
                nodeType = metaTestSuite.nodeTestFileName
                print " node type is " ; nodeType
                node = m.testScene.CallFunc("Rooibos_CreateTestNode", nodeType)
                if (type(node) = "roSGNode" and node.subType() = nodeType) then
                    args = {
                        "metaTestSuite": metaTestSuite,
                        "testUtilsDecoratorMethodName": m.testUtilsDecoratorMethodName,
                        "config": m.config,
                        "runtimeConfig": m.runtimeConfig
                    }
                    nodeStatResults = node.callFunc("Rooibos_RunNodeTests", args)
                    if nodeStatResults <> invalid then
                        Rooibos_Stats_mergeTotalStatistic(totalStatObj, nodeStatResults)
                    else
                        print " ERROR! The node " ; nodeType ; " did not return stats from the Rooibos_RunNodeTests method. This usually means you are not importing rooibosDist.brs, or rooibosFunctionMap.brs. Please refer to : https://github.com/georgejecook/rooibos/blob/master/docs/index.md#testing-scenegraph-nodes"
                    end if
                    m.testScene.RemoveChild(node)
                else
                    print " ERROR!! - could not create node required to execute tests for " ; metaTestSuite.name
                    print " Node of type " ; nodeType ; " was not found/could not be instantiated"
                end if
            else
                if (metaTestSuite.hasIgnoredTests) then
                    totalStatObj.IgnoredTestNames.push("|-" + metaTestSuite.name)
                end if
                m.RunItGroups(metaTestSuite, totalStatObj, m.testUtilsDecoratorMethodName, m.config, m.runtimeConfig, m.nodeContext)
            end if
            skipSuite:
        end for
        m.logger.PrintStatistic(totalStatObj)
        if m.socket <> invalid then
            m.socket.sendResults(totalStatObj)
        end if
        if Rooibos_Common_isFunction(RBS_ReportCodeCoverage) then
            'bs:disable-next-line
            RBS_ReportCodeCoverage()
            if m.config.printLcov = true then
                Rooibos_Coverage_printLCovInfo()
            end if
        end if
        m.sendHomeKeypress()
    end sub
    instance.sendHomeKeypress = sub()
        ut = CreateObject("roUrlTransfer")
        ' ut.SetUrl("http://localhost:8060/keypress/Home")
        ut.PostFromString("")
    end sub
    return instance
end function
function Rooibos_TestRunner(args = {})
    instance = __Rooibos_TestRunner_builder()
    instance.new(args)
    return instance
end function
sub Rooibos_TestRunnerMixin_RunItGroups(metaTestSuite, totalStatObj, testUtilsDecoratorMethodName, config, runtimeConfig, nodeContext = invalid)
    if (testUtilsDecoratorMethodName <> invalid) then
        testUtilsDecorator = Rooibos_Common_getFunctionBruteForce(testUtilsDecoratorMethodName)
        if (not Rooibos_Common_isFunction(testUtilsDecorator)) then
            print "[ERROR] Test utils decorator method `" ; testUtilsDecoratorMethodName ; "` was not in scope! for testSuite: " + metaTestSuite.name
        end if
    end if
    for each itGroup in metaTestSuite.itGroups
        testSuite = Rooibos_ItGroup_GetRunnableTestSuite(itGroup)
        if (nodeContext <> invalid) then
            testSuite.node = nodeContext
            testSuite.global = nodeContext.global
            testSuite.top = nodeContext.top
        end if
        if (Rooibos_Common_isFunction(testUtilsDecorator)) then
            testUtilsDecorator(testSuite)
        end if
        totalStatObj.Ignored = totalStatObj.Ignored + itGroup.ignoredTestCases.count()
        if (itGroup.isIgnored = true) then
            if (config.logLevel = 2) then
                print "Ignoring itGroup " ; itGroup.name ; " Due to Ignore flag"
            end if
            totalStatObj.ignored = totalStatObj.ignored + itGroup.testCases.count()
            totalStatObj.IgnoredTestNames.push("  |-" + itGroup.name + " [WHOLE GROUP]")
            goto skipItGroup
        else
            if (itGroup.ignoredTestCases.count() > 0) then
                totalStatObj.IgnoredTestNames.push("  |-" + itGroup.name)
                totalStatObj.ignored = totalStatObj.ignored + itGroup.ignoredTestCases.count()
                for each testCase in itGroup.ignoredTestCases
                    if (testcase.isParamTest <> true) then
                        totalStatObj.IgnoredTestNames.push("  | |--" + testCase.name)
                    else if (testcase.paramTestIndex = 0) then
                        testCaseName = testCase.Name
                        if (len(testCaseName) > 1 and right(testCaseName, 1) = "0") then
                            testCaseName = left(testCaseName, len(testCaseName) - 1)
                        end if
                        totalStatObj.IgnoredTestNames.push("  | |--" + testCaseName)
                    end if
                end for
            end if
        end if
        if (runtimeConfig.hasSoloTests) then
            if (itGroup.hasSoloTests <> true) then
                if (config.logLevel = 2) then
                    print "Ignoring itGroup " ; itGroup.name ; " Because it has no solo tests"
                end if
                goto skipItGroup
            end if
        else if (runtimeConfig.hasSoloGroups) then
            if (itGroup.isSolo <> true) then
                goto skipItGroup
            end if
        end if
        if (testSuite.testCases.Count() = 0) then
            if (config.logLevel = 2) then
                print "Ignoring TestSuite " ; itGroup.name ; " - NO TEST CASES"
            end if
            goto skipItGroup
        end if
        print ""
        print Rooibos_Common_fillText("> GROUP: " + itGroup.name, ">", 80)
        if Rooibos_Common_isFunction(testSuite.SetUp) then
            testSuite.SetUp()
        end if
        Rooibos_TestRunnerMixin_RunTestCases(metaTestSuite, itGroup, testSuite, totalStatObj, config, runtimeConfig)
        if Rooibos_Common_isFunction(testSuite.TearDown) then
            testSuite.TearDown()
        end if
        if (totalStatObj.testRunHasFailures = true and config.failFast = true) then
            exit for
        end if
        skipItGroup:
    end for
end sub
sub Rooibos_TestRunnerMixin_RunTestCases(metaTestSuite, itGroup, testSuite, totalStatObj, config, runtimeConfig)
    suiteStatObj = Rooibos_Stats_createSuiteStatistic(itGroup.Name)
    testSuite.global = runtimeConfig.global
    for each testCase in testSuite.testCases
        metaTestCase = itGroup.testCaseLookup[testCase.Name]
        metaTestCase.time = 0
        if (runtimeConfig.hasSoloTests and not metaTestCase.isSolo) then
            goto skipTestCase
        end if
        print ""
        print Rooibos_Common_fillText("> TEST: " + testCase.Name + " ", ">", 80)
        if Rooibos_Common_isFunction(testSuite.beforeEach) then
            testSuite.beforeEach()
        end if
        testTimer = CreateObject("roTimespan")
        testCaseTimer = CreateObject("roTimespan")
        testStatObj = Rooibos_Stats_createTestStatistic(testCase.Name)
        testSuite.testCase = testCase.Func
        testStatObj.filePath = metaTestSuite.filePath
        testStatObj.metaTestCase = metaTestCase
        testSuite.currentResult = Rooibos_UnitTestResult()
        testStatObj.metaTestCase.testResult = testSuite.currentResult
        if (metaTestCase.isParamsValid) then
            if (metaTestCase.isParamTest) then
                testCaseParams = []
                for paramIndex = 0 to metaTestCase.rawParams.count()
                    paramValue = metaTestCase.rawParams[paramIndex]
                    if type(paramValue) = "roString" and len(paramValue) >= 8 and left(paramValue, 8) = "#RBSNode" then
                        nodeType = "ContentNode"
                        paramDirectiveArgs = paramValue.split("|")
                        if paramDirectiveArgs.count() > 1 then
                            nodeType = paramDirectiveArgs[1]
                        end if
                        paramValue = createObject("roSGNode", nodeType)
                    end if
                    testCaseParams.push(paramValue)
                end for
                testCaseTimer.mark()
                if (metaTestCase.expectedNumberOfParams = 1) then
                    testSuite.testCase(testCaseParams[0])
                else if (metaTestCase.expectedNumberOfParams = 2) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1])
                else if (metaTestCase.expectedNumberOfParams = 3) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2])
                else if (metaTestCase.expectedNumberOfParams = 4) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3])
                else if (metaTestCase.expectedNumberOfParams = 5) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4])
                else if (metaTestCase.expectedNumberOfParams = 6) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5])
                else if (metaTestCase.expectedNumberOfParams = 7) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6])
                else if (metaTestCase.expectedNumberOfParams = 8) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6], testCaseParams[7])
                else if (metaTestCase.expectedNumberOfParams = 9) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6], testCaseParams[7], testCaseParams[8])
                else if (metaTestCase.expectedNumberOfParams = 10) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6], testCaseParams[7], testCaseParams[8], testCaseParams[9])
                else if (metaTestCase.expectedNumberOfParams = 11) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6], testCaseParams[7], testCaseParams[8], testCaseParams[9], testCaseParams[10])
                else if (metaTestCase.expectedNumberOfParams = 12) then
                    testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5], testCaseParams[6], testCaseParams[7], testCaseParams[8], testCaseParams[9], testCaseParams[10], testCaseParams[11])
                else if (metaTestCase.expectedNumberOfParams > 12) then
                    testSuite.fail("Test case had more than 12 params. Max of 12 params is supported")
                end if
                metaTestCase.time = testCaseTimer.totalMilliseconds()
            else
                testCaseTimer.mark()
                testSuite.testCase()
                metaTestCase.time = testCaseTimer.totalMilliseconds()
            end if
        else
            testSuite.Fail("Could not parse args for test ")
        end if
        if testSuite.isAutoAssertingMocks = true then
            testSuite.AssertMocks()
            testSuite.CleanMocks()
            testSuite.CleanStubs()
        end if
        runResult = testSuite.currentResult.getResult()
        if runResult <> "" then
            testStatObj.result = "Fail"
            testStatObj.error.Code = 1
            testStatObj.error.Message = runResult
        else
            testStatObj.result = "Success"
        end if
        testStatObj.time = testTimer.totalMilliseconds()
        Rooibos_Stats_appendTestStatistic(suiteStatObj, testStatObj)
        if Rooibos_Common_isFunction(testSuite.afterEach) then
            testSuite.afterEach()
        end if
        if testStatObj.result <> "Success" then
            totalStatObj.testRunHasFailures = true
        end if
        if testStatObj.result = "Fail" and config.failFast = true then
            exit for
        end if
        skipTestCase:
    end for
    suiteStatObj.metaTestSuite = metaTestSuite
    Rooibos_Stats_appendSuiteStatistic(totalStatObj, suiteStatObj)
end sub
function __Rooibos_UnitTestResult_builder()
    instance = {}
    instance.new = sub()
        m.messages = []
        m.isFail = false
        m.currentAssertIndex = 0
        m.failedAssertIndex = 0
        m.failedMockLineNumber = - 1
    end sub
    instance.reset = function() as void
        m.isFail = false
        m.failedMockLineNumber = - 1
        m.messages = []
    end function
    instance.addResult = function(message as string) as string
        if (message <> "") then
            m.messages.push(message)
            if (not m.isFail) then
                m.failedAssertIndex = m.currentAssertIndex
            end if
            m.isFail = true
        end if
        m.currentAssertIndex++
        return message
    end function
    instance.addMockResult = function(lineNumber, message as string) as string
        if (message <> "") then
            m.messages.push(message)
            if (not m.isFail) then
                m.failedMockLineNumber = lineNumber
            end if
            m.isFail = true
        end if
        return message
    end function
    instance.getResult = function() as string
        if (m.isFail) then
            msg = m.messages.peek()
            if (msg <> invalid) then
                return msg
            else
                return "unknown test failure"
            end if
        else
            return ""
        end if
    end function
    return instance
end function
function Rooibos_UnitTestResult()
    instance = __Rooibos_UnitTestResult_builder()
    instance.new()
    return instance
end function