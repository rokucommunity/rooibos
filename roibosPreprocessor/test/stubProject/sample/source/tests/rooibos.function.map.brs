'@Namespace RBSFM Rooibos Function Map
function RBSFM_getFuncitonsForFile(filename)
  map = {
    "VideoModuleTests":RBSFM_getFunctions_VideoModule
    "NodeExampleTests":RBSFM_getFunctions_NodeExampleTests
  } 
  return map[filename]
end function

function RBSFM_getFunctions_VideoModule()
  return {
    "VMT_BeforeEach"                      :VMT_BeforeEach
    "VMT__constructor_basic"              :VMT__constructor_basic
    "VMT__getVideos_basic"                :VMT__getVideos_basic
    "VMT__getVideosRealExample_basic"     :VMT__getVideosRealExample_basic
  }
end function

function RBSFM_getFunctions_NodeExampleTests()
  return {
    "NET_setup":                      NET_setup                
    "NET_BeforeEach":                 NET_BeforeEach           
    "NET__HelloFromNode_simple":      NET__HelloFromNode_simple
    "NET__HelloFromNode_params":      NET__HelloFromNode_params
  }
end function



