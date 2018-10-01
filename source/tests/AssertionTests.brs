'@TestSuite [RBSA] Rooibos assertion tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
function Simp_basic_Fail() as void
    
    assertResult = m.Fail("reason")

    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)           
end function

'@Test AssertTrue
'@Params[true, true]
'@Params[false, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertTrue(value, expectedAssertResult) as void
    
    assertResult = m.AssertTrue(value)
    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertEqual(assertResult, expectedAssertResult)    		
    m.AssertEqual(isFail, not expectedAssertResult)    		
end function

'@Test AssertFalse
'@Params[false, true]
'@Params[true, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertFalse(value, expectedAssertResult) as void
    
    assertResult = m.AssertFalse(value)

    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertEqual(assertResult, expectedAssertResult)           
    m.AssertEqual(isFail, not expectedAssertResult)           
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertArrayContainsAAs
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
'@Params[[{"one":1}], [{"one":2}]]
'@Params[[{"one":1}], [{"one":"a"}]]
'@Params[[{"one":1}], [{}]]
'@Params[[{"one":1}], [invalid]]
'@Params[[{"one":1}], []]
'@Params[[{"one":1}], invalid]
'@Params[[{"one":1}], [[]] ]
'@Params[[{"one":1}], ["wrong"] ]
'@Params[[{"one":1}], [2] ]
'@Params[[{"one":"a"}], [{"one":1}] ]
'@Params[[{"two":1}], [{"one":1}] ]
'@Params[[invalid], [{"one":1}] ]
'@Params[invalid, [{"one":1}] ]
'@Params[[{"one":1, "two":2}], [{"one":"1"}] ]
'@Params[[{"one":1}, {"two":2}], [{"one":"1"}, {"two":"a"}] ]
'@Params[[{"one":1}, {"two":2}], [{"a":1}, {"a":1}, {"a":1}] ]
function Simp_AssertArrayContainsAAs_Fail(expectedAAs, items) as void
    
    assertResult = m.AssertArrayContainsAAs(items, expectedAAs)

    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)           
end function


'@Test pass
'@Params[[], []]
'@Params[[{}], [{}]]
'@Params[[{"one":1}], [{"one":1}]]
'@Params[[{"one":1, "two":2}], [{"one":1, "two":2}]]
'@Params[[{"one":1, "two":2}], [{ "two":2, "one":1}]]
'@Params[[{"one":1, "two":2}, {"one":1}], [{"one":1}, { "two":2, "one":1}]]
'@Params[[{"one":1, "two":2}, {"one":1}, {"three":3}], [{"one":1}, {"three":3}, { "two":2, "one":1}]]
function Simp_AssertArrayContainsAAs_Pass(expectedAAs, items) as void
    
    assertResult = m.AssertArrayContainsAAs(items, expectedAAs)
    
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertTrue(assertResult)
    m.AssertFalse(isFail)           
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertArrayContainsOnlyValuesOfType
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[["one", "two", "three"], "String"]
'@Params[[1, 2, 3], "Integer"]
'@Params[[true, true, false], "Boolean"]
'@Params[[[true, true], [false, false]], "Array"]
'@Params[[{"test":1}, {"test":1}], "AssociativeArray"]
function Simp_AssertArrayContainsOnlyValuesOfType_Pass(values, typeName) as void

    assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertTrue(assertResult)
    m.AssertFalse(isFail)           
  
end function

'@Test fail 
'@Params[["one", 2, "three"], "String"]
'@Params[[1, "two", 3], "Integer"]
'@Params[[true, "true", false], "Boolean"]
'@Params[[[true, true], false, false], "Array"]
'@Params[[{"test":1}, "notAA"], "AssociativeArray"]
'@Params[["one", "two", "three"], "UnknownType"]
'@Params[["one", "two", "three"], "Integer"]
'@Params[[1, 2, 3], "String"]
'@Params[[true, true, false], "String"]
'@Params[[[true, true], [false, false]], "AssociativeArray"]
'@Params[[{"test":1}, {"test":1}], "Array"]
function Simp_AssertArrayContainsOnlyValuesOfType_Fail(values, typeName) as void

    assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
    isFail = m.currentResult.isFail

    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)          

  
end function

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
function Simp_EqArray_Pass(values, values2, expected) as void

    result = m.EqArray(values, values2)
    m.AssertEqual(result, expected)
  
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertNotEmpty
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[["one", "two", "three"]]
'@Params[[1, 2, 3]]
'@Params[[true]]
'@Params[[[true, true], [false, false]]]
'@Params[[{"test":1}]]
'@Params["not empty"]
'@Params[[invalid]]
function Simp_AssertNotEmpty_Pass(values) as void

    assertResult = m.AssertNotEmpty(values)
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertTrue(assertResult)
    m.AssertFalse(isFail)           
  
end function

'@Test fail
'@Params[invalid]
'@Params[[]]
'@Params[{}]
'@Params[1]
'@Params[""]
function Simp_AssertNotEmpty_Fail(values) as void

    assertResult = m.AssertNotEmpty(values)
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)           
  
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertEmpty
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[[]]
'@Params[{}]
'@Params[""]
function Simp_AssertEmpty_Pass(values) as void

    assertResult = m.AssertEmpty(values)
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertTrue(assertResult)
    m.AssertFalse(isFail)           

end function

'@Test fail
'@Params[1]
'@Params[invalid]
'@Params[["one", "two", "three"]]
'@Params[[1, 2, 3]]
'@Params[[true]]
'@Params[[[true, true], [false, false]]]
'@Params[[{"test":1}]]
'@Params["not empty"]
'@Params[[invalid]]
function Simp_AssertEmpty_Fail(values) as void

    assertResult = m.AssertEmpty(values)
    isFail = m.currentResult.isFail

    m.currentResult.Reset()
    m.AssertFalse(assertResult)
    m.AssertTrue(isFail)           
  
end function

'ASSERTIONS TO WRITE TESTS FOR!

'This is coming soon!

'    AssertEqual                 
'    AssertLike                  
'    AssertNotEqual              
'    AssertInvalid               
'    AssertNotInvalid            
'    AssertAAHasKey              
'    AssertAANotHasKey           
'    AssertAAHasKeys             
'    AssertAANotHasKeys          
'    AssertArrayNotContains      
'    AssertArrayContainsSubset   
'    AssertArrayNotContainsSubsetet
'    AssertArrayCount            
'    AssertArrayNotCount         
'    AssertArrayContainsOnly     
'    AssertType                  
'    AssertSubType               
'    
'    'Node extensions
'    AssertNodeCount             
'    AssertNodeNotCount          
'    AssertNodeEmpty             
'    AssertNodeNotEmpty          
'    AssertNodeContains          
'    AssertNodeNotContains       
'    AssertNodeContainsFields    
'    AssertNodeNotContainsFields 

'    AssertArray   
'    AssertAAContainsSubset   
'
'    'Mocking and stubbing
'    AssertMocks     
'    MockFail        