'@TestSuite [CPT] ComplexParamsTests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It complex params
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Only
'@Test basic test
'@Params[invalid, invalid, invalid]
'@Params[{}, invalid, invalid]
'@Params[{}, invalid, invalid]
'@Params[{isClip:true}, invalid, "clip"]
'@Params[{isClip:true}, {}, "clip"]
'@Params[{isClip:true}, {type:"EpisodeContentItem"}, "clip"]
'@Params[{isClip:false}, {type:"Episode"}, "episode"]
'@Params[{isClip:false}, {type:"EpisodeContentItem"}, "episode"]
'@Params[{isClip:false}, {type:"EpisodeSearchHit"}, "episode"]
'@Params[{isClip:false}, {type:"Show"}, "show"]
'@Params[{isClip:false}, {type:"ShowContentItem"}, "show"]
'@Params[{isClip:false}, {type:"ShowSearchHit"}, "show"]
function CPT_getVideosRealExample_basic(videoType, returnedJson, typeName) as void
  getjsonMock = m.expectOnce(m.httpService, "getJson", [m.ignoreValue, videoType], returnedJson, true)

  videos = m.module.getVideosRealExample(videoType)

  m.AssertArrayContainsSubset(videos, returnedJson)
end function