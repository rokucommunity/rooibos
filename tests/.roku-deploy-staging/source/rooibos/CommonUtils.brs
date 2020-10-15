' /**
'  * @module CommonUtils
'  */
' /******************
' Common utility functions
' /******************

' /**
'  * @name IsXmlElement
'  * @function
'  * @description check if value contains XMLElement interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains XMLElement interface, else return false
'  */
function Rooibos_Common_isXmlElement(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifXMLElement") <> invalid
end function

' /**
'  * @name IsFunction
'  * @function
'  * @description check if value contains Function interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Function interface, else return false
'  */
function Rooibos_Common_isFunction(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifFunction") <> invalid
end function

' /**
'  * @name Rooibos.Common.getFunction
'  * @function
'  * @description looks up the function by name, for the function map
'  * @memberof module:CommonUtils
'  * @param {filename} string - name of the file where the function was found
'  * @param {String} functionName - name of the function to locate
'  * @returns {Function} - function pointer or invalid
'  */
function Rooibos_Common_getFunction(filename, functionName) as object
    if not Rooibos_Common_isNotEmptyString(functionName) then
        return invalid
    end if
    if not Rooibos_Common_isNotEmptyString(filename) then
        return invalid
    end if
    'bs:disable-next-line
    mapFunction = RBSFM_getFunctionsForFile(filename)
    if mapFunction <> invalid then
        map = mapFunction()
        if type(map) = "roAssociativeArray" then
            functionPointer = map[functionName]
            return functionPointer
        else
            return invalid
        end if
    end if
    return invalid
end function

' /**
'  * @name Rooibos.Common.getFunctionBruteforce
'  * @function
'  * @description looks up the function by name, from any function map
'  *            in future
'  * @memberof module:CommonUtils
'  * @param {filename} string - name of the file where the function was found
'  * @param {String} functionName - name of the function to locate
'  * @returns {Function} - function pointer or invalid
'  */
function Rooibos_Common_getFunctionBruteForce(functionName) as object
    if not Rooibos_Common_isNotEmptyString(functionName) then
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
            if type(map) = "roAssociativeArray" then
                functionPointer = map[functionName]
                if functionPointer <> invalid then
                    return functionPointer
                end if
            end if
        end if
    end for
    return invalid
end function

' /**
'  * @name IsBoolean
'  * @function
'  * @description check if value contains Boolean interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Boolean interface, else return false
'  */
function Rooibos_Common_isBoolean(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifBoolean") <> invalid
end function

' /**
'  * @name IsInteger
'  * @function
'  * @description check if value type equals Integer
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value type equals Integer, else return false
'  */
function Rooibos_Common_isInteger(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifInt") <> invalid and (Type(value) = "roInt" or Type(value) = "roInteger" or Type(value) = "Integer")
end function

' /**
'  * @name IsFloat
'  * @function
'  * @description check if value contains Float interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Float interface, else return false
'  */
function Rooibos_Common_isFloat(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifFloat") <> invalid
end function

' /**
'  * @name IsDouble
'  * @function
'  * @description check if value contains Double interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Double interface, else return false
'  */
function Rooibos_Common_isDouble(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifDouble") <> invalid
end function

' /**
'  * @name IsLongInteger
'  * @function
'  * @description check if value contains LongInteger interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains LongInteger interface, else return false
'  */
function Rooibos_Common_isLongInteger(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifLongInt") <> invalid
end function

' /**
'  * @name IsNumber
'  * @function
'  * @description check if value contains LongInteger or Integer or Double or Float interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value is number, else return false
'  */
function Rooibos_Common_isNumber(value) as boolean
    return Rooibos_Common_isLongInteger(value) or Rooibos_Common_isDouble(value) or Rooibos_Common_isInteger(value) or Rooibos_Common_isFloat(value)
end function

' /**
'  * @name IsList
'  * @function
'  * @description check if value contains List interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains List interface, else return false
'  */
function Rooibos_Common_isList(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifList") <> invalid
end function

' /**
'  * @name IsArray
'  * @function
'  * @description check if value contains Array interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Array interface, else return false
'  */
function Rooibos_Common_isArray(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifArray") <> invalid
end function

' /**
'  * @name IsAssociativeArray
'  * @function
'  * @description check if value contains AssociativeArray interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains AssociativeArray interface, else return false
'  */
function Rooibos_Common_isAssociativeArray(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifAssociativeArray") <> invalid
end function

' /**
'  * @name IsSGNode
'  * @function
'  * @description check if value contains SGNodeChildren interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains SGNodeChildren interface, else return false
'  */
function Rooibos_Common_isSGNode(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifSGNodeChildren") <> invalid
end function

' /**
'  * @name IsString
'  * @function
'  * @description check if value contains String interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains String interface, else return false
'  */
function Rooibos_Common_isString(value) as boolean
    return Rooibos_Common_isValid(value) and GetInterface(value, "ifString") <> invalid
end function

' /**
'  * @name IsNotEmptyString
'  * @function
'  * @description check if value contains String interface and length more 0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains String interface and length more 0, else return false
'  */
function Rooibos_Common_isNotEmptyString(value) as boolean
    return Rooibos_Common_isString(value) and len(value) > 0
end function

' /**
'  * @name IsDateTime
'  * @function
'  * @description check if value contains DateTime interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains DateTime interface, else return false
'  */
function Rooibos_Common_isDateTime(value) as boolean
    return Rooibos_Common_isValid(value) and (GetInterface(value, "ifDateTime") <> invalid or Type(value) = "roDateTime")
end function

' /**
'  * @name IsValid
'  * @function
'  * @description check if value initialized and not equal invalid
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value initialized and not equal invalid, else return false
'  */
function Rooibos_Common_isValid(value) as boolean
    return not Rooibos_Common_isUndefined(value) and value <> invalid
end function

function Rooibos_Common_isUndefined(value) as boolean
    return type(value) = "" or Type(value) = "<uninitialized>"
end function

' /**
'  * @name ValidStr
'  * @function
'  * @description return value if his contains String interface else return empty string
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {String} - value if his contains String interface else return empty string
'  */
function Rooibos_Common_validStr(obj) as string
    if obj <> invalid and GetInterface(obj, "ifString") <> invalid then
        return obj
    else
        return ""
    end if
end function

' /**
'  * @name AsString
'  * @function
'  * @description convert input to String if this possible, else return empty string
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {String} - converted string
'  */
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
        if not isFirst then
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

' /**
'  * @name AsInteger
'  * @function
'  * @description convert input to Integer if this possible, else return 0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Integer} - converted Integer
'  */
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

' /**
'  * @name AsLongInteger
'  * @function
'  * @description convert input to LongInteger if this possible, else return 0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Integer} - converted LongInteger
'  */
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

' /**
'  * @name AsFloat
'  * @function
'  * @description convert input to Float if this possible, else return 0.0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Float} - converted Float
'  */
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

' /**
'  * @name AsDouble
'  * @function
'  * @description convert input to Double if this possible, else return 0.0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Float} - converted Double
'  */
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

' /**
'  * @name AsBoolean
'  * @function
'  * @description convert input to Boolean if this possible, else return False
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Boolean} - converted boolean
'  */
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

' /**
'  * @name AsArray
'  * @function
'  * @description if type of value equals array return value, else return array with one element [value]
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Array} - converted array
'  */
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
'=====================
' Strings
'=====================

' /**
'  * @name IsNullOrEmpty
'  * @function
'  * @description check if value is invalid or empty
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value is null or empty string, else return false
'  */
function Rooibos_Common_isNullOrEmpty(value) as boolean
    if Rooibos_Common_isString(value) then
        return Len(value) = 0
    else
        return not Rooibos_Common_isValid(value)
    end if
end function
'=====================
' Arrays
'=====================

' /**
'  * @name FindElementIndexInArray
'  * @function
'  * @description find an element index in array
'  * @memberof module:CommonUtils
'  * @param {Dynamic} array - array to search
'  * @param {Dynamic} value - value to check
'  * @param {Dynamic} compareAttribute - attribue to use for comparisons
'  * @param {Boolean} caseSensitive - indicates if comparisons are case sensitive
'  * @returns {Integer} - element index if array contains a value, else return -1
'  */
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

' /**
'  * @name ArrayContains
'  * @function
'  * @description check if array contains specified value
'  * @memberof module:CommonUtils
'  * @param {Dynamic} array - array to search in
'  * @param {Dynamic} value - value to check
'  * @param {Dynamic} compareAttribute - attribute to compare on
'  * @returns {Boolean} - true if array contains a value, else return false
'  */
function Rooibos_Common_arrayContains(array, value, compareAttribute = invalid) as boolean
    return (Rooibos_Common_findElementIndexInArray(array, value, compareAttribute) > - 1)
end function
'=====================
' NODES
'=====================

' /**
'  * @name FindElementIndexInNode
'  * @function
'  * @description find an element index in node
'  * @memberof module:CommonUtils
'  * @param {Dynamic} node - node to search in
'  * @param {Dynamic} value - child to search for
'  * @returns {Integer} - element index if node contains a value, else return -1
'  */
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

' /**
'  * @name NodeContains
'  * @description check if node contains specified child
'  * @memberof module:CommonUtils
'  * @param {Dynamic} node - the node to check on
'  * @param {Dynamic} value - child to look for
'  * @returns {Boolean} - true if node contains a value, else return false
'  */
function Rooibos_Common_nodeContains(node, value) as boolean
    return (Rooibos_Common_findElementIndexInNode(node, value) > - 1)
end function

' /**
'  * @memberof module:CommonUtils
'  * @name EqValues
'  * @function
'  * @instance
'  * @description Compare two arbtrary values to eachother.
'  * @param {Dynamic} Vallue1 - first item to compare
'  * @param {Dynamic} Vallue2 - second item to compare
'  * @returns {boolean} - True if values are equal or False in other case.
'  */
function Rooibos_Common_eqValues(Value1, Value2) as dynamic
    ' Workaraund for bug with string boxing, and box everything else
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
    'update types after boxing
    val1Type = type(Value1)
    val2Type = type(Value2)
    'Upcast int to float, if other is float
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
        else if valtype = "roSGNode" then
            if val2Type <> "roSGNode" then
                return false
            else
                return Value1.isSameNode(Value2)
            end if
        else 'If you crashed on this line, then you're trying to compare
            '2 things which can't be compared - check what value1 and value2
            'are in your debug log
            return Value1 = Value2
        end if
    end if
end function

' /**
'  * @memberof module:CommonUtils
'  * @name EqAssocArray
'  * @function
'  * @instance
'  * @description Compare to roAssociativeArray objects for equality.
'  * @param {Dynamic} Vallue1 - first associative array
'  * @param {Dynamic} Vallue2 - second associative array
'  * @returns {boolean} - True if arrays are equal or False in other case.
'  */
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

' /**
'  * @memberof module:CommonUtils
'  * @name EqArray
'  * @function
'  * @instance
'  * @description Compare to roArray objects for equality.
'  * @param {Dynamic} Vallue1 - first array
'  * @param {Dynamic} Vallue2 - second array
'  * @returns {boolean} - True if arrays are equal or False in other case.
'  */
function Rooibos_Common_eqArray(Value1, Value2) as dynamic
    if not (Rooibos_Common_isArray(Value1)) or not Rooibos_Common_isArray(Value) then
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

' /**
'  * @member fillText
'  * @memberof module:CommonUtils
'  * @instance
'  * @description Fills text with count of fillChars
'  * @param {string} text - text to fill
'  * @param {string} fillChar - char to fill with
'  * @param {integer} numChars - target length
'  * @returns {string} filled string
'  */
function Rooibos_Common_fillText(text as string, fillChar = " ", numChars = 40) as string
    if len(text) >= numChars then
        text = left(text, numChars - 5) + "..." + fillChar + fillChar
    else
        numToFill = numChars - len(text) - 1
        for i = 0 to numToFill
            text = text + fillChar
        end for
    end if
    return text
end function