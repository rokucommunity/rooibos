' /**
'  * @module TestSuite
'  * @description All brs files that include `'@TestSuite` annotations automatically extend the TestSuite.
'  * The base test suite contains all of the assertions, and utility methods required to writey our tests, as well as being responsible for tracking the state of the tests and groups.
'  */
function __Rooibos_BaseTestSuite_builder()
    instance = {}
    'test state
    'set the name to the name of your test
    'special values
    ' special value used in mock arguments
    ' special value used in mock arguments
    'built in any matchers
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ base methods to override
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    instance.new = function()
        m.name = "BaseTestSuite"
        m.filePath = invalid
        m.pkgPath = invalid
        m.isValid = false
        m.hasSoloTests = false
        m.hasIgnoredTests = false
        m.isSolo = false
        m.isIgnored = false
        m.isNodeTest = false
        m.nodeName = invalid
        m.lineNumber = 1
        m.groups = []
        m.groupsData = []
        m.stats = invalid
        m.currentAssertLineNumber = - 1
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
        m.currentResult = invalid
        m.global = invalid
        data = m.getTestSuitedata()
        m.name = data.name
        m.filePath = data.filePath
        m.pkgPath = data.pkgPath
        m.valid = data.valid
        m.hasFailures = data.hasFailures
        m.hasSoloTests = data.hasSoloTests
        m.hasIgnoredTests = data.hasIgnoredTests
        m.hasSoloGroups = data.hasSoloGroups
        m.isSolo = data.isSolo
        m.isIgnored = data.isIgnored
        m.groupsData = data.testGroups
        m.lineNumber = data.lineNumber
        m.isNodeTest = false
        m.nodeName = invalid
        m.isFailingFast = false
        m.stats = Rooibos_Stats()
    end function
    instance.getTestSuiteData = function()
        'this will be injected by the plugin
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ used for entire suite - use annotations to use elsewhere
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    instance.setup = function()
    end function
    instance.tearDown = function()
    end function
    instance.beforeEach = function()
    end function
    instance.afterEach = function()
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ running
    '++++++++++++++++++++++++++++++++++++?+++++++++++++++++++++++++
    instance.run = function()
        for each groupData in m.groupsData
            'bs:disable-next-line
            group = Rooibos_TestGroup(m, groupData)
            m.groups.push(group)
            group.run()
            m.stats.merge(group.stats)
            if m.stats.hasFailures and m.isFailingFast = true then
                print "Terminating suite due to failed group"
                exit for
            end if
        end for
    end function
    instance.runTest = function(test)
        m.currentResult = test.result
        test.run()
        if m.isAutoAssertingMocks = true then
            m.AssertMocks()
            m.CleanMocks()
            m.CleanStubs()
        end if
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ Assertions
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name fail
    '  * @function
    '  * @instance
    '  * @description Fail immediately, with the given message
    '  * @param {Dynamic} [msg=""] - message to display in the test report
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.fail = function(msg = "Error") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        m.currentResult.fail(msg, m.currentAssertLineNumber)
        return false
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertFalse
    '  * @function
    '  * @instance
    '  * @description Fail the test if the expression is true.
    '  * @param {Dynamic} expr - An expression to evaluate.
    '  * @param {Dynamic} [msg=""] - alternate error message
    ' Default value: "Expression evaluates to true"'  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertFalse = function(expr, msg = "Expression evaluates to true") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if not Rooibos_Common_isBoolean(expr) or expr then
            return m.fail(msg)
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertTrue
    '  * @function
    '  * @instance
    '  * @description Fail the test unless the expression is true.
    '  * @param {Dynamic} expr - An expression to evaluate.
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertTrue = function(expr, msg = "Expression evaluates to false")
        if m.currentResult.isFail then
            return false
        end if
        if not Rooibos_Common_isBoolean(expr) or not expr then
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertEqual
    '  * @function
    '  * @instance
    '  * @description Fail if the two objects are unequal as determined by the '<>' operator.
    '  * @param {Dynamic} first - first object to compare
    '  * @param {Dynamic} second - second object to compare
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertEqual = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if not Rooibos_Common_eqValues(first, second) then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " != " + second_as_string
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertLike
    '  * @function
    '  * @instance
    '  * @description does a fuzzy comparison
    '  * @param {Dynamic} first - first object to compare
    '  * @param {Dynamic} second - second object to compare
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertLike = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if first <> second then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " != " + second_as_string
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNotEqual
    '  * @function
    '  * @instance
    '  * @description Fail if the two objects are equal as determined by the '=' operator.
    '  * @param {Dynamic} first - first object to compare
    '  * @param {Dynamic} second - second object to compare
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNotEqual = function(first, second, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_eqValues(first, second) then
            if msg = "" then
                first_as_string = Rooibos_Common_asString(first)
                second_as_string = Rooibos_Common_asString(second)
                msg = first_as_string + " == " + second_as_string
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertInvalid
    '  * @function
    '  * @instance
    '  * @description Fail if the value is not invalid.
    '  * @param {Dynamic} value - value to check - value to check for
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertInvalid = function(value, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if value <> invalid then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " <> Invalid"
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNotInvalid
    '  * @function
    '  * @instance
    '  * @description Fail if the value is invalid.
    '  * @param {Dynamic} value - value to check - value to check for
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNotInvalid = function(value, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if value = invalid then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " = Invalid"
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertAAHasKey
    '  * @function
    '  * @instance
    '  * @description Fail if the array doesn't have the key.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} key - key name
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertAAHasKey = function(array, key, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) then
            if not array.DoesExist(key) then
                if msg = "" then
                    msg = "Array doesn't have the '" + key + "' key."
                end if
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertAANotHasKey
    '  * @function
    '  * @instance
    '  * @description Fail if the array has the key.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} key - key name
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertAANotHasKey = function(array, key, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) then
            if array.DoesExist(key) then
                if msg = "" then
                    msg = "Array has the '" + key + "' key."
                end if
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertAAHasKeys
    '  * @function
    '  * @instance
    '  * @description Fail if the array doesn't have the keys list.
    '  * @param {Dynamic} array - A target associative array.
    '  * @param {Dynamic} keys - Array of key names.
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertAAHasKeys = function(array, keys, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isArray(keys) then
            for each key in keys
                if not array.DoesExist(key) then
                    if msg = "" then
                        msg = "Array doesn't have the '" + key + "' key."
                    end if
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertAANotHasKeys
    '  * @function
    '  * @instance
    '  * @description Fail if the array has the keys list.
    '  * @param {Dynamic} array - A target associative array.
    '  * @param {Dynamic} keys - Array of key names.
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertAANotHasKeys = function(array, keys, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isArray(keys) then
            for each key in keys
                if array.DoesExist(key) then
                    if msg = "" then
                        msg = "Array has the '" + key + "' key."
                    end if
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for
        else
            msg = "Input value is not an Associative Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayContains
    '  * @function
    '  * @instance
    '  * @description Fail if the array doesn't have the item.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} value - value to check - value to check for
    '  * @param {Dynamic} key - key name in associative array
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayContains = function(array, value, key = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if not Rooibos_Common_arrayContains(array, value, key) then
                msg = "Array doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayContainsAAs
    '  * @function
    '  * @instance
    '  * @description Fail if the array does not contain all of the aa's in the values array.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} values - array of aas to look for in target array
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayContainsAAs = function(array, values, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if not Rooibos_Common_isArray(values) then
            msg = "values to search for are not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        if Rooibos_Common_isArray(array) then
            for each value in values
                isMatched = false
                if not Rooibos_Common_isAssociativeArray(value) then
                    msg = "Value to search for was not associativeArray " + Rooibos_Common_asString(value)
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
                for each item in array
                    if Rooibos_Common_IsAssociativeArray(item) then
                        isValueMatched = true
                        for each key in value
                            fieldValue = value[key]
                            itemValue = item[key]
                            if not Rooibos_Common_eqValues(fieldValue, itemValue) then
                                isValueMatched = false
                                exit for
                            end if
                        end for
                        if isValueMatched then
                            isMatched = true
                            exit for
                        end if
                    end if
                end for ' items in array
                if not isMatched then
                    msg = "array missing value: " + Rooibos_Common_asString(value)
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for 'values to match
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayNotContains
    '  * @function
    '  * @instance
    '  * @description Fail if the array has the item.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} value - value to check - Value to check for
    '  * @param {Dynamic} key - A key name for associative array.
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayNotContains = function(array, value, key = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if Rooibos_Common_arrayContains(array, value, key) then
                msg = "Array has the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayContainsSubset
    '  * @function
    '  * @instance
    '  * @description Fail if the array doesn't have the item subset.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} subset - items to check presnece of
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayContainsSubset = function(array, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
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
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayNotContainsSubset
    '  * @function
    '  * @instance
    '  * @description Fail if the array have the item from subset.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} subset - items to check presnece of
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayNotContainsSubset = function(array, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
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
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayCount
    '  * @function
    '  * @instance
    '  * @description Fail if the array items count <> expected count
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} count - An expected array items count
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayCount = function(array, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if array.Count() <> count then
                msg = "Array items count " + Rooibos_Common_asString(array.Count()) + " <> " + Rooibos_Common_asString(count) + "."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayNotCount
    '  * @function
    '  * @instance
    '  * @description Fail if the array items count = expected count.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} count - An expected array items count.
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayNotCount = function(array, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            if array.Count() = count then
                msg = "Array items count = " + Rooibos_Common_asString(count) + "."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertEmpty
    '  * @function
    '  * @instance
    '  * @description Fail if the item is not empty array or string.
    '  * @param {Dynamic} item - item to check
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertEmpty = function(item, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(item) or Rooibos_Common_isArray(item) then
            if item.count() > 0 then
                msg = "Array is not empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else if Rooibos_Common_isString(item) then
            if Rooibos_Common_asString(item) <> "" then
                msg = "Input value is not empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "AssertEmpty: Input value was not an array or a string"
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNotEmpty
    '  * @function
    '  * @instance
    '  * @description Fail if the item is empty array or string.
    '  * @param {Dynamic} item - item to check
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNotEmpty = function(item, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(item) or Rooibos_Common_isArray(item) then
            if item.count() = 0 then
                msg = "Array is empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else if Rooibos_Common_isString(item) then
            if item = "" then
                msg = "Input value is empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not a string or array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertArrayContainsOnlyValuesOfType
    '  * @function
    '  * @instance
    '  * @description Fail if the array doesn't contains items of specific type only.
    '  * @param {Dynamic} array - target array
    '  * @param {Dynamic} typeStr - type name - must be String, Array, Boolean, or AssociativeArray
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertArrayContainsOnlyValuesOfType = function(array, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if typeStr <> "String" and typeStr <> "Integer" and typeStr <> "Boolean" and typeStr <> "Array" and typeStr <> "AssociativeArray" then
            msg = "Type must be Boolean, String, Array, Integer, or AssociativeArray"
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) or Rooibos_Common_isArray(array) then
            methodName = "Rooibos_Common_Is" + typeStr
            typeCheckFunction = m.getIsTypeFunction(methodName)
            if typeCheckFunction <> invalid then
                for each item in array
                    if not typeCheckFunction(item) then
                        msg = Rooibos_Common_asString(item) + "is not a '" + typeStr + "' type."
                        m.currentResult.fail(msg, m.currentAssertLineNumber)
                        return false
                    end if
                end for
            else
                msg = "could not find comparator for type '" + typeStr + "' type."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Array."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
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
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertType
    '  * @function
    '  * @instance
    '  * @description Asserts that the value is a node of designated type
    '  * @param {Dynamic} value - value to check - target node
    '  * @param {Dynamic} typeStr - type name
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertType = function(value, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(value) <> typeStr then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " was not expected type " + typeStr
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertSubType
    '  * @function
    '  * @instance
    '  * @description Asserts that the value is a node of designated subtype
    '  * @param {Dynamic} value - value to check - target node
    '  * @param {Dynamic} typeStr - type name
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertSubType = function(value, typeStr, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(value) <> "roSGNode" then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + " was not a node, so could not match subtype " + typeStr
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        else if value.subType() <> typeStr then
            if msg = "" then
                expr_as_string = Rooibos_Common_asString(value)
                msg = expr_as_string + "( type : " + value.subType() + ") was not of subType " + typeStr
            end if
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ NEW NODE ASSERTS
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeCount
    '  * @function
    '  * @instance
    '  * @description Asserts that the node contains the desginated number of children
    '  * @param {Dynamic} node - target node
    '  * @param {Dynamic} count - expected number of child items
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert w, false otherwise
    '  */
    instance.assertNodeCount = function(node, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() <> count then
                msg = "node items count <> " + Rooibos_Common_asString(count) + ". Received " + Rooibos_Common_asString(node.getChildCount())
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeNotCount
    '  * @function
    '  * @instance
    '  * @description Fail if the node items count = expected count.
    '  * @param {Dynamic} node - A target node
    '  * @param {Dynamic} count - Expected item count
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeNotCount = function(node, count, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() = count then
                msg = "node items count = " + Rooibos_Common_asString(count) + "."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeEmpty
    '  * @function
    '  * @instance
    '  * @description Asserts the node has no children
    '  * @param {Dynamic} node - a node to check
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeEmpty = function(node, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if node.getChildCount() > 0 then
                msg = "node is not empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeNotEmpty
    '  * @function
    '  * @instance
    '  * @description Asserts the node has children
    '  * @param {Dynamic} node - a node to check
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeNotEmpty = function(node, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if node.Count() = 0 then
                msg = "Array is empty."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeContains
    '  * @function
    '  * @instance
    '  * @description Asserts the node contains the child _value_
    '  * @param {Dynamic} node - a node to check
    '  * @param {Dynamic} value - value to check - value to look for
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeContains = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if not Rooibos_Common_nodeContains(node, value) then
                msg = "Node doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeContainsOnly
    '  * @function
    '  * @instance
    '  * @description Asserts the node contains only the child _value_
    '  * @param {Dynamic} node - a node to check
    '  * @param {Dynamic} value - value to check - value to look for
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeContainsOnly = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if not Rooibos_Common_nodeContains(node, value) then
                msg = "Node doesn't have the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            else if node.getChildCount() <> 1 then
                msg = "Node Contains speicified value; but other values as well"
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeNotContains
    '  * @function
    '  * @instance
    '  * @description Fail if the node h item.
    '  * @param {Dynamic} node - A target node
    '  * @param {Dynamic} value - value to check - a node child
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeNotContains = function(node, value, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if type(node) = "roSGNode" then
            if Rooibos_Common_nodeContains(node, value) then
                msg = "Node has the '" + Rooibos_Common_asString(value) + "' value."
                m.currentResult.fail(msg, m.currentAssertLineNumber)
                return false
            end if
        else
            msg = "Input value is not an Node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeContainsFields
    '  * @function
    '  * @instance
    '  * @description Fail if the node doesn't have the item subset.
    '  * @param {Dynamic} node - A target node
    '  * @param {Dynamic} subset - items to check
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertNodeContainsFields = function(node, subset, ignoredFields = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if (type(node) = "roSGNode" and Rooibos_Common_isAssociativeArray(subset)) or (type(node) = "roSGNode" and Rooibos_Common_isArray(subset)) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            isIgnoredFields = Rooibos_Common_isArray(ignoredFields)
            for each key in subset
                if key <> "" then
                    if not isIgnoredFields or not Rooibos_Common_arrayContains(ignoredFields, key) then
                        subsetValue = subset[key]
                        nodeValue = node[key]
                        if not Rooibos_Common_eqValues(nodeValue, subsetValue) then
                            msg = key + ": Expected '" + Rooibos_Common_asString(subsetValue) + "', got '" + Rooibos_Common_asString(nodeValue) + "'"
                            m.currentResult.fail(msg, m.currentAssertLineNumber)
                            return false
                        end if
                    end if
                else
                    print "Found empty key!"
                end if
            end for
        else
            msg = "Input value is not an Node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertNodeNotContainsFields
    '  * @function
    '  * @instance
    '  * @description Fail if the node have the item from subset.
    '  * @param {Dynamic} node - A target node
    '  * @param {Dynamic} subset - the items to check for
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert w, false otherwise
    ' */
    instance.assertNodeNotContainsFields = function(node, subset, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
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
                    m.currentResult.fail(msg, m.currentAssertLineNumber)
                    return false
                end if
            end for
        else
            msg = "Input value is not an Node."
            m.currentResult.fail(msg, m.currentAssertLineNumber)
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ END NODE ASSERTS
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertAAContainsSubset
    '  * @function
    '  * @instance
    '  * @description Asserts the associative array contains the fields contained in subset; while ignoring the fields in the ignoredFields array
    '  * @param {Dynamic} array - associative array  to check
    '  * @param {Dynamic} subset - associative array of values to check for
    '  * @param {Dynamic} ignoredFields - array of fieldnames to ignore while comparing
    '  * @param {Dynamic} [msg=""] - alternate error message
    '  * @returns {boolean} - true if the assert was satisfied, false otherwise
    '  */
    instance.assertAAContainsSubset = function(array, subset, ignoredFields = invalid, msg = "") as dynamic
        if m.currentResult.isFail then
            return false
        end if
        if Rooibos_Common_isAssociativeArray(array) and Rooibos_Common_isAssociativeArray(subset) then
            isAA = Rooibos_Common_isAssociativeArray(subset)
            isIgnoredFields = Rooibos_Common_isArray(ignoredFields)
            for each key in subset
                if key <> "" then
                    if not isIgnoredFields or not Rooibos_Common_arrayContains(ignoredFields, key) then
                        subsetValue = subset[key]
                        arrayValue = array[key]
                        if not Rooibos_Common_eqValues(arrayValue, subsetValue) then
                            msg = key + ": Expected '" + Rooibos_Common_asString(subsetValue) + "', got '" + Rooibos_Common_asString(arrayValue) + "'"
                            m.currentResult.fail(msg, m.currentAssertLineNumber)
                            return false
                        end if
                    end if
                else
                    print "Found empty key!"
                end if
            end for
        else
            msg = "Input values are not an Associative Array."
            return false
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ Stubbing helpers
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name stub
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - stub that was wired into the real method
    '  */
    instance.stub = function(target, methodName, returnValue = invalid, allowNonExistingMethods = false) as object
        if type(target) <> "roAssociativeArray" then
            m.fail("could not create Stub provided target was null")
            return {}
        end if
        if m.stubs = invalid then
            m.__stubId = - 1
            m.stubs = {}
        end if
        m.__stubId++
        if m.__stubId > 5 then
            print "ERROR ONLY 6 STUBS PER TEST ARE SUPPORTED!!"
            return invalid
        end if
        id = stri(m.__stubId).trim()
        fake = m.createFake(id, target, methodName, 1, invalid, returnValue)
        m.stubs[id] = fake
        allowNonExisting = m.allowNonExistingMethodsOnMocks = true or allowNonExistingMethods
        isMethodPresent = type(target[methodName]) = "Function" or type(target[methodName]) = "roFunction"
        if isMethodPresent or allowNonExisting then
            target[methodName] = m["StubCallback" + id]
            target.__stubs = m.stubs
            if not isMethodPresent then
                print "WARNING - stubbing call " ; methodName ; " which did not exist on target object"
            end if
        else
            print "ERROR - could not create Stub : method not found  " ; target ; "." ; methodName
        end if
        return fake
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name expectOnce
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with, which the framework will track. If it was invoked the wrong number of times, or with wrong arguments, it will result in test failure
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} [expectedArgs=invalid] - array containing the arguments we expect the method to be invoked with
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - mock that was wired into the real method
    '  */
    instance.expectOnce = function(target, methodName, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 1, expectedArgs, returnValue, allowNonExistingMethods)
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name expectOnceOrNone
    '  * @function
    '  * @instance
    '  * @description Toggles between expectOnce and expectNone, to allow for easy paremeterized expect behaviour
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} isExpected - if true, then this is the same as expectOnce, if false, then this is the same as expectNone
    '  * @param {Dynamic} [expectedArgs=invalid] - array containing the arguments we expect the method to be invoked with
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - mock that was wired into the real method
    '  */
    instance.expectOnceOrNone = function(target, methodName, isExpected, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        if isExpected then
            return m.expectOnce(target, methodName, expectedArgs, returnValue, allowNonExistingMethods)
        else
            return m.expectNone(target, methodName, allowNonExistingMethods)
        end if
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name expectNone
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with, which the framework will track. If it was invoked, it will result in test failure
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - mock that was wired into the real method
    '  */
    instance.expectNone = function(target, methodName, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, 0, invalid, invalid, allowNonExistingMethods)
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name expect
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with, which the framework will track. If it was invoked the wrong number of times, or with wrong arguments, it will result in test failure
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} [expectedInvocations=1] - number of invocations we expect
    '  * @param {Dynamic} [expectedArgs=invalid] - array containing the arguments we expect the method to be invoked with
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - mock that was wired into the real method
    '  */
    instance.expect = function(target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        return m.mock(target, methodName, expectedInvocations, expectedArgs, returnValue, allowNonExistingMethods)
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name mock
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with, which the framework will track. If it was invoked the wrong number of times, or with wrong arguments, it will result in test failure
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} expectedInvocations - number of invocations we expect
    '  * @param {Dynamic} [expectedArgs=invalid] - array containing the arguments we expect the method to be invoked with
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @param {boolean} [allowNonExistingMethods=false] - if true, then rooibos will only warn if the method did not exist prior to faking
    '  * @returns {Object} - mock that was wired into the real method
    '  */
    instance.mock = function(target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid, allowNonExistingMethods = false) as object
        lineNumber = m.currentAssertLineNumber
        'check params
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
            print "ERROR! Cannot create MOCK. method " ; methodName ; " " ; str(lineNumber) ; " " ; m.currentResult.message
            return {}
        end if
        if m.mocks = invalid then
            m.__mockId = - 1
            m.__mockTargetId = - 1
            m.mocks = {}
        end if
        fake = invalid
        if not target.doesExist("__rooibosTargetId") then
            m.__mockTargetId++
            target["__rooibosTargetId"] = m.__mockTargetId
        end if
        'ascertain if mock already exists
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
            if m.__mockId > 25 then
                print "ERROR ONLY 25 MOCKS PER TEST ARE SUPPORTED!! you're on # " ; m.__mockId
                print " Method was " ; methodName
                return invalid
            end if
            fake = m.createFake(id, target, methodName, expectedInvocations, expectedArgs, returnValue)
            m.mocks[id] = fake 'this will bind it to m
            allowNonExisting = m.allowNonExistingMethodsOnMocks = true or allowNonExistingMethods
            isMethodPresent = type(target[methodName]) = "Function" or type(target[methodName]) = "roFunction"
            if isMethodPresent or allowNonExisting then
                target[methodName] = m["MockCallback" + id]
                target.__mocks = m.mocks
                if not isMethodPresent then
                    print "WARNING - mocking call " ; methodName ; " which did not exist on target object"
                end if
            else
                print "ERROR - could not create Mock : method not found  " ; target ; "." ; methodName
            end if
        else
            m.combineFakes(fake, m.createFake(id, target, methodName, expectedInvocations, expectedArgs, returnValue))
        end if
        return fake
    end function
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name createFake
    '  * @function
    '  * @instance
    '  * @description Creates a stub to replace a real method with. This is used internally.
    '  * @param {Dynamic} target - object on which the method to be stubbed is found
    '  * @param {Dynamic} methodName - name of method to stub
    '  * @param {Dynamic} [expectedInvocations=1] - number of invocations we expect
    '  * @param {Dynamic} [expectedArgs=invalid] - array containing the arguments we expect the method to be invoked with
    '  * @param {Dynamic} [returnValue=invalid] - value that the stub method will return when invoked
    '  * @returns {Object} - stub that was wired into the real method
    '  */
    instance.createFake = function(id, target, methodName, expectedInvocations = 1, expectedArgs = invalid, returnValue = invalid) as object
        expectedArgsValues = []
        lineNumber = m.currentAssertLineNumber
        hasArgs = Rooibos_Common_isArray(expectedArgs)
        if hasArgs then
            defaultValue = m.invalidValue
        else
            defaultValue = m.ignoreValue
            expectedArgs = []
        end if
        lineNumbers = [
            lineNumber
        ]
        for i = 0 to 9
            if hasArgs and expectedArgs.count() > i then
                'guard against bad values 
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
                ' ? "FAKE CALLBACK CALLED FOR " ; m.methodName
                if m.allInvokedArgs = invalid then
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
                if type(m.returnValue) = "roAssociativeArray" and m.returnValue.doesExist("multiResult") then
                    returnValues = m.returnValue["multiResult"]
                    returnIndex = m.invocations - 1
                    if type(returnValues) = "roArray" and returnValues.count() > 0 then
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
        'add on the expected invoked args
        lineNumber = m.currentAssertLineNumber
        if type(fake.expectedArgs) <> "roAssociativeArray" or not fake.expectedArgs.doesExist("multiInvoke") then
            currentExpectedArgsArgs = fake.expectedArgs
            fake.expectedArgs = {
                "multiInvoke": [
                    currentExpectedArgsArgs
                ]
            }
        end if
        fake.expectedArgs.multiInvoke.push(otherFake.expectedArgs)
        'add on the expected return values
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
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name assertMocks
    '  * @function
    '  * @instance
    '  * @description Will check all mocks that have been created to ensure they were invoked the expected amount of times, with the expected args.
    '  */
    instance.assertMocks = function() as void
        if m.__mockId = invalid or not Rooibos_Common_isAssociativeArray(m.mocks) then
            return
        end if
        lastId = int(m.__mockId)
        for each id in m.mocks
            mock = m.mocks[id]
            methodName = mock.methodName
            if mock.expectedInvocations <> mock.invocations then
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
                        if didNotExpectArg then
                            expected = invalid
                        end if
                        isUsingMatcher = Rooibos_Common_isAssociativeArray(expected) and Rooibos_Common_isFunction(expected.matcher)
                        if isUsingMatcher then
                            if not expected.matcher(value) then
                                m.mockFail(mock.lineNumbers[invocationIndex], methodName, "on Invocation #" + stri(invocationIndex).trim() + ", expected arg #" + stri(i).trim() + "  to match matching function '" + Rooibos_Common_asString(expected.matcher) + "' got '" + Rooibos_Common_asString(value) + "')")
                                m.cleanMocks()
                            end if
                        else
                            if not (Rooibos_Common_isString(expected) and expected = m.ignoreValue) and not Rooibos_Common_eqValues(value, expected) then
                                if expected = invalid then
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
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name cleanMocks
    '  * @function
    '  * @instance
    '  * @description Cleans up all tracking data associated with mocks
    '  */
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
    ' /**
    '  * @memberof module:BaseTestSuite
    '  * @name cleanStubs
    '  * @function
    '  * @instance
    '  * @description Cleans up all tracking data associated with stubs
    '  */
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
            return false
        end if
        m.currentResult.fail("mock failure on '" + methodName + "' : " + message, lineNumber)
        return false
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ Fake Stub callback functions - this is required to get scope
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
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
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ Fake Mock callback functions - this is required to get scope
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
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
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ crude async support
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ' /**
    '  * @member waitForField
    '  * @memberof module:TestUtils
    '  * @instance
    '  * @function
    '  * @description observeField doesn't work in regular unit tests, so we have to wait for the result. We can use this to wait for a network task, foe example, and pass the result directly to a handler. Note - we wait for the value TO CHANGE - so make sure that will be the case, or you'll get stuck forever :)
    '  * @param {any} target to observe
    '  * @param {string} field to observe
    '  * @param {int} delay for each wait
    '  * @param {int} max attempts
    '  */
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
            return false
        end if
        if target = invalid then
            m.fail("Target was invalid")
        end if
        result = m.waitForField(target, fieldName, delay, maxAttempts)
        if not result then
            return m.fail("Timeout waiting for targetField " + fieldName + " to be set on target")
        end if
        m.currentResult.fail("", m.nextTestLInNumber)
        return true
    end function
    return instance
end function
function Rooibos_BaseTestSuite()
    instance = __Rooibos_BaseTestSuite_builder()
    instance.new()
    return instance
end function