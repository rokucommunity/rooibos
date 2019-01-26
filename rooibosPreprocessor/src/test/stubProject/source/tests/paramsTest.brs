'@TestSuite [VMT] VideoModuleTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It simple params
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test basic test
'@Params["mp4", ["a", "b", "c"]]
'@Params["mp3", ["a", "b", "c", "d", "e"]]
function VMT__getVideosRealExample_basic(videoType, returnedJson) as void
  getjsonMock = m.expectOnce(m.httpService, "getJson", [m.ignoreValue, videoType], returnedJson, true)

  videos = m.module.getVideosRealExample(videoType)

  m.AssertArrayContainsSubset(videos, returnedJson)
end function