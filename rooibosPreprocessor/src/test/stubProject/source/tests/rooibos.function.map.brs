undefined
'***************************************************
'Function maps 
'***************************************************

function RBSFM_getFunctionsForFile(filename)
  map = {
    "NodeExampleTests":RBSFM_getFunctions_NodeExampleTests 
    "VideoModuleTests":RBSFM_getFunctions_VideoModuleTests 
    "test_LegacyIntegration":RBSFM_getFunctions_test_LegacyIntegration 
  } 
  return map[filename]
end function

function RBSFM_getFunctions_NodeExampleTests()
  return {
    "NET_setup":NET_setup 
    "NET_BeforeEach":NET_BeforeEach 
    "NET__HelloFromNode_simple":NET__HelloFromNode_simple 
    "NET__HelloFromNode_params":NET__HelloFromNode_params 
  } 

end function

function RBSFM_getFunctions_VideoModuleTests()
  return {
    "VMT_BeforeEach":VMT_BeforeEach 
    "VMT__constructor_basic":VMT__constructor_basic 
    "VMT__getVideos_basic":VMT__getVideos_basic 
    "VMT__getVideosRealExample_basic":VMT__getVideosRealExample_basic 
  } 

end function

function RBSFM_getFunctions_test_LegacyIntegration()
  return {
    "testSuite_LegacyIntegration":testSuite_LegacyIntegration 
    "LegacyIntegrationTestSuite_SetUp":LegacyIntegrationTestSuite_SetUp 
    "testCase_LegacyIntegration_simpleResult":testCase_LegacyIntegration_simpleResult 
    "testCase_LegacyIntegration_multipleAsserts":testCase_LegacyIntegration_multipleAsserts 
  } 

end function



    function RBSFM_getTestSuitesForProject()
        return [
        
,

,

,

      ]
    end function
