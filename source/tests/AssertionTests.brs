'@TestSuite [RBSA] Rooibos assertion tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
function Simp__basic_Fail() as void
    
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
function Simp__basic_AssertTrue(value, expectedAssertResult) as void
    
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
function Simp__basic_AssertFalse(value, expectedAssertResult) as void
    
    assertResult = m.AssertFalse(value)

    isFail = m.currentResult.isFail
    m.currentResult.Reset()
    
    m.AssertEqual(assertResult, expectedAssertResult)           
    m.AssertEqual(isFail, not expectedAssertResult)           
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
'    AssertArrayContains         
'    AssertArrayNotContains      
'    AssertArrayContainsSubset   
'    AssertArrayNotContainsSubsetet
'    AssertArrayCount            
'    AssertArrayNotCount         
'    AssertEmpty                 
'    AssertNotEmpty              
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