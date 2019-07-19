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
function RBS_CMN_IsXmlElement(value) as boolean
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
function RBS_CMN_IsFunction(value) as boolean
  return RBS_CMN_IsValid(value) and GetInterface(value, "ifFunction") <> invalid
end function


' /**
'  * @name RBS_CMN_GetFunction
'  * @function
'  * @description looks up the function by name, for the function map
'  * @memberof module:CommonUtils
'  * @param {filename} string - name of the file where the function was found
'  * @param {String} functionName - name of the function to locate
'  * @returns {Function} - function pointer or invalid
'  */
function RBS_CMN_GetFunction(filename, functionName) as object
  if (not RBS_CMN_IsNotEmptyString(functionName)) then return invalid
  if (not RBS_CMN_IsNotEmptyString(filename)) then return invalid
  mapFunction = RBSFM_getFunctionsForFile(filename)
  if mapFunction <> invalid
    map = mapFunction()
    if (type(map) = "roAssociativeArray")
      functionPointer = map[functionName]
      return functionPointer
    else
      return invalid
    end if
  end if
  return invalid
  
end function

' /**
'  * @name RBS_CMN_GetFunctionBruteforce
'  * @function
'  * @description looks up the function by name, from any function map
'  *            in future, functions retrieved in this way are stored in the special RBS_INTERNAL file map
'  * @memberof module:CommonUtils
'  * @param {filename} string - name of the file where the function was found
'  * @param {String} functionName - name of the function to locate
'  * @returns {Function} - function pointer or invalid
'  */
function RBS_CMN_GetFunctionBruteForce(functionName) as object
  if (not RBS_CMN_IsNotEmptyString(functionName)) then return invalid
  ' func = RBS_CMN_GetFunction("RBS_INTERNAL", functionName)
  ' if func <> invalid
  '   return func
  ' end if
  
  filenames = RBSFM_getFilenames()
  for i = 0 to filenames.count() - 1
    filename = filenames[i]
    mapFunction = RBSFM_getFunctionsForFile(filename)
    if mapFunction <> invalid
      map = mapFunction()
      if (type(map) = "roAssociativeArray")
        functionPointer = map[functionName]
        if functionPointer <> invalid
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
function RBS_CMN_IsBoolean(value) as boolean
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
function RBS_CMN_IsInteger(value) as boolean
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
function RBS_CMN_IsFloat(value) as boolean
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
function RBS_CMN_IsDouble(value) as boolean
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
function RBS_CMN_IsLongInteger(value) as boolean
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
function RBS_CMN_IsNumber(value) as boolean
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
function RBS_CMN_IsList(value) as boolean
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
function RBS_CMN_IsArray(value) as boolean
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
function RBS_CMN_IsAssociativeArray(value) as boolean
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
function RBS_CMN_IsSGNode(value) as boolean
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
function RBS_CMN_IsString(value) as boolean
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
function RBS_CMN_IsNotEmptyString(value) as boolean
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
function RBS_CMN_IsDateTime(value) as boolean
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
function RBS_CMN_IsValid(value) as boolean
  return not RBS_CMN_IsUndefined(value) and value <> invalid
end function

function RBS_CMN_IsUndefined(value) as boolean
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
function RBS_CMN_ValidStr(obj) as string
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
function RBS_CMN_AsString(input) as string
  if RBS_CMN_IsValid(input) = false
    return ""
  else if RBS_CMN_IsString(input)
    return input
  else if RBS_CMN_IsInteger(input) or RBS_CMN_IsLongInteger(input) or RBS_CMN_IsBoolean(input)
    return input.ToStr()
  else if RBS_CMN_IsFloat(input) or RBS_CMN_IsDouble(input)
    return Str(input).Trim()
  else if type(input) = "roSGNode"
    return "Node(" + input.subType() + ")"
  else if type(input) = "roAssociativeArray"
    isFirst = true
    text = "{"
    if (not isFirst)
      text += ","
      isFirst = false
    end if
    for each key in input
      if key <> "__mocks" and key <> "__stubs"
        text += key + ":" + RBS_CMN_AsString(input[key])
      end if
    end for
    text += "}"
    return text
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
function RBS_CMN_AsInteger(input) as integer
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
function RBS_CMN_AsLongInteger(input) as longinteger
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
function RBS_CMN_AsFloat(input) as float
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
function RBS_CMN_AsDouble(input) as double
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
function RBS_CMN_AsBoolean(input) as boolean
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
function RBS_CMN_AsArray(value) as object
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
function RBS_CMN_IsNullOrEmpty(value) as boolean
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
function RBS_CMN_FindElementIndexInArray(array , value , compareAttribute = invalid , caseSensitive = false) as integer
  if RBS_CMN_IsArray(array)
    for i = 0 to RBS_CMN_AsArray(array).Count() - 1
      compareValue = array[i]
      
      if compareAttribute <> invalid and RBS_CMN_IsAssociativeArray(compareValue)
        compareValue = compareValue.LookupCI(compareAttribute)
      end if
      
      if RBS_BTS_EqValues(compareValue, value)
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
function RBS_CMN_ArrayContains(array , value , compareAttribute = invalid) as boolean
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
function RBS_CMN_FindElementIndexInNode(node , value) as integer
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
function RBS_CMN_NodeContains(node , value) as boolean
  return (RBS_CMN_FindElementIndexInNode(node, value) > -1)
end function
