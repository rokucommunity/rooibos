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
function RBS_CMN_IsXmlElement(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifXMLElement") <> invalid
end function

' /**
'  * @name IsFunction
'  * @function
'  * @description check if value contains Function interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Function interface, else return false
'  */
function RBS_CMN_IsFunction(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifFunction") <> invalid
end function


' /**
'  * @name GetFunction
'  * @function
'  * @description given the func, or name, will try to resolve a function pointer to the function, or return func, if it's already a valid funciton pointer
'  * @memberof module:CommonUtils
'  * @param {Function} func - function pointer, which could be invalid
'  * @param {String} name - name of the function to locate, if func is invalid
'  * @returns {Function} - function pointer if func was not invalid, or the function could be resolved via the function name
'  */
function RBS_CMN_GetFunction(func, name) as Object
    if (RBS_CMN_IsFunction(func)) then return func
    if (not RBS_CMN_IsNotEmptyString(name)) then return invalid
    
    res = eval("functionPointer=" + name)
    if (RBS_CMN_IsInteger(res) and res = 252 and RBS_CMN_IsFunction(functionPointer))
        return functionPointer
    else
        return invalid
    end if
    
end function
' /**
'  * @name IsBoolean
'  * @function
'  * @description check if value contains Boolean interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Boolean interface, else return false
'  */
function RBS_CMN_IsBoolean(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifBoolean") <> invalid
end function

' /**
'  * @name IsInteger
'  * @function
'  * @description check if value type equals Integer
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value type equals Integer, else return false
'  */
function RBS_CMN_IsInteger(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifInt") <> invalid and (Type(value) = "roInt" or Type(value) = "roInteger" or Type(value) = "Integer")
end function

' /**
'  * @name IsFloat
'  * @function
'  * @description check if value contains Float interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Float interface, else return false
'  */
function RBS_CMN_IsFloat(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifFloat") <> invalid
end function

' /**
'  * @name IsDouble
'  * @function
'  * @description check if value contains Double interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Double interface, else return false
'  */
function RBS_CMN_IsDouble(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifDouble") <> invalid
end function

' /**
'  * @name IsLongInteger
'  * @function
'  * @description check if value contains LongInteger interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains LongInteger interface, else return false
'  */
function RBS_CMN_IsLongInteger(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifLongInt") <> invalid
end function

' /**
'  * @name IsNumber
'  * @function
'  * @description check if value contains LongInteger or Integer or Double or Float interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value is number, else return false
'  */
function RBS_CMN_IsNumber(value as Dynamic) as Boolean
    return RBS_CMN_IsLongInteger(value) or RBS_CMN_IsDouble(value) or RBS_CMN_IsInteger(value) or RBS_CMN_IsFloat(value)
end function

' /**
'  * @name IsList
'  * @function
'  * @description check if value contains List interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains List interface, else return false
'  */
function RBS_CMN_IsList(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifList") <> invalid
end function

' /**
'  * @name IsArray
'  * @function
'  * @description check if value contains Array interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains Array interface, else return false
'  */
function RBS_CMN_IsArray(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifArray") <> invalid
end function

' /**
'  * @name IsAssociativeArray
'  * @function
'  * @description check if value contains AssociativeArray interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains AssociativeArray interface, else return false
'  */
function RBS_CMN_IsAssociativeArray(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifAssociativeArray") <> invalid
end function

' /**
'  * @name IsSGNode
'  * @function
'  * @description check if value contains SGNodeChildren interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains SGNodeChildren interface, else return false
'  */
function RBS_CMN_IsSGNode(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifSGNodeChildren") <> invalid
end function

' /**
'  * @name IsString
'  * @function
'  * @description check if value contains String interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains String interface, else return false
'  */
function RBS_CMN_IsString(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and GetInterface(value, "ifString") <> invalid
end function

' /**
'  * @name IsNotEmptyString
'  * @function
'  * @description check if value contains String interface and length more 0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains String interface and length more 0, else return false
'  */
function RBS_CMN_IsNotEmptyString(value as Dynamic) as Boolean
    return RBS_CMN_IsString(value) and len(value) > 0
end function

' /**
'  * @name IsDateTime
'  * @function
'  * @description check if value contains DateTime interface
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value contains DateTime interface, else return false
'  */
function RBS_CMN_IsDateTime(value as Dynamic) as Boolean
    return RBS_CMN_IsValid(value) and (GetInterface(value, "ifDateTime") <> invalid or Type(value) = "roDateTime")
end function

' /**
'  * @name IsValid
'  * @function
'  * @description check if value initialized and not equal invalid
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {Boolean} - true if value initialized and not equal invalid, else return false
'  */
function RBS_CMN_IsValid(value as Dynamic) as Boolean
    return Type(value) <> "<uninitialized>" and value <> invalid
end function

' /**
'  * @name ValidStr
'  * @function
'  * @description return value if his contains String interface else return empty string
'  * @memberof module:CommonUtils
'  * @param {Dynamic} value - value to check
'  * @returns {String} - value if his contains String interface else return empty string
'  */
function RBS_CMN_ValidStr(obj as Object) as String
    if obj <> invalid and GetInterface(obj, "ifString") <> invalid
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
function RBS_CMN_AsString(input as Dynamic) as String
    if RBS_CMN_IsValid(input) = false
        return ""
    else if RBS_CMN_IsString(input)
        return input
    else if RBS_CMN_IsInteger(input) or RBS_CMN_IsLongInteger(input) or RBS_CMN_IsBoolean(input)
        return input.ToStr()
    else if RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input)
        return Str(input).Trim()
    else if type(input) = "roSGNode"
        return "Node(" + input.subType() +")"
    else
        return ""
    end If
end function

' /**
'  * @name AsInteger
'  * @function
'  * @description convert input to Integer if this possible, else return 0
'  * @memberof module:CommonUtils
'  * @param {Dynamic} input - value to check
'  * @returns {Integer} - converted Integer
'  */
function RBS_CMN_AsInteger(input as Dynamic) as Integer
    if RBS_CMN_IsValid(input) = false
        return 0
    else if RBS_CMN_IsString(input)
        return input.ToInt()
    else if RBS_CMN_IsInteger(input)
        return input
    else if RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input) or RBS_CMN_IsLongInteger(input)
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
function RBS_CMN_AsLongInteger(input as Dynamic) as LongInteger
    if RBS_CMN_IsValid(input) = false
        return 0
    else if RBS_CMN_IsString(input)
        return RBS_CMN_AsInteger(input)
    else if RBS_CMN_IsLongInteger(input) or RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input) or RBS_CMN_IsInteger(input)
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
function RBS_CMN_AsFloat(input as Dynamic) as Float
    if RBS_CMN_IsValid(input) = false
        return 0.0
    else if RBS_CMN_IsString(input)
        return input.ToFloat()
    else if RBS_CMN_IsInteger(input)
        return (input / 1)
    else if RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input) or RBS_CMN_IsLongInteger(input)
        return input
    else
        return 0.0
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
function RBS_CMN_AsDouble(input as Dynamic) as Double
    if RBS_CMN_IsValid(input) = false
        return 0.0
    else if RBS_CMN_IsString(input)
        return RBS_CMN_AsFloat(input)
    else if RBS_CMN_IsInteger(input) or RBS_CMN_IsLongInteger(input) or RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input)
        return input
    else
        return 0.0
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
function RBS_CMN_AsBoolean(input as Dynamic) as Boolean
    if RBS_CMN_IsValid(input) = false
        return false
    else if RBS_CMN_IsString(input)
        return LCase(input) = "true"
    else if RBS_CMN_IsInteger(input) or RBS_CMN_IsFloat(input)
        return input <> 0
    else if RBS_CMN_IsBoolean(input)
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
function RBS_CMN_AsArray(value as Object) as Object
    if RBS_CMN_IsValid(value)
        if not RBS_CMN_IsArray(value)
            return [value]
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
function RBS_CMN_IsNullOrEmpty(value as Dynamic) as Boolean
    if RBS_CMN_IsString(value)
        return Len(value) = 0
    else
        return not RBS_CMN_IsValid(value)
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
function RBS_CMN_FindElementIndexInArray(array as Object, value as Object, compareAttribute = invalid as Dynamic, caseSensitive = false as Boolean) as Integer
    if RBS_CMN_IsArray(array)
        for i = 0 to RBS_CMN_AsArray(array).Count() - 1
            compareValue = array[i]

            if compareAttribute <> invalid and RBS_CMN_IsAssociativeArray(compareValue)
                compareValue = compareValue.LookupCI(compareAttribute)
            end If

            if RBS_CMN_IsString(compareValue) and RBS_CMN_IsString(value) and not caseSensitive
                if LCase(compareValue) = LCase(value)
                    return i
                end If
            else if compareValue = value
                return i
            end if

            item = array[i]
        next
    end if
    return -1
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
function RBS_CMN_ArrayContains(array as Object, value as Object, compareAttribute = invalid as Dynamic) as Boolean
    return (RBS_CMN_FindElementIndexInArray(array, value, compareAttribute) > -1)
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
function RBS_CMN_FindElementIndexInNode(node as Object, value as Object) as Integer
    if type(node) = "roSGNode" 
        for i = 0 to node.getChildCount() - 1
            compareValue = node.getChild(i)
            if type(compareValue) = "roSGNode" and compareValue.isSameNode(value)
                return i
            end if
        next
    end if
    return -1
end function

' /**
'  * @name NodeContains
'  * @description check if node contains specified child
'  * @memberof module:CommonUtils
'  * @param {Dynamic} node - the node to check on
'  * @param {Dynamic} value - child to look for
'  * @returns {Boolean} - true if node contains a value, else return false
'  */
function RBS_CMN_NodeContains(node as Object, value as Object) as Boolean
    return (RBS_CMN_FindElementIndexInNode(node, value) > -1)
end function
