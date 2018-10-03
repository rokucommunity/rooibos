'@TestSuite [VMT] VideoModuleTests

'@BeforeEach
function VMT_BeforeEach()
  m.constants = {}
  m.httpService = {}
  
  m.module = VideoModule(m.constants, m.httpService)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests constructor
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test basic constructor values
function VMT__constructor_basic() as void
	m.AssertEqual(m.module.constants_, m.constants)
	m.AssertEqual(m.module.httpService_, m.httpService)
end function


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests getVideos
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test basic test
'@Params[3, "mp4", ["video_0", "video_1", "video_2"]]
'@Params[2, "mpg", ["video_0", "video_1"]]
'@Params[1, "vp8", ["video_0"]]
function VMT__getVideos_basic(expectedCount, videoType, videoIds) as void
	videos = m.module.getVideos(videoType)

	m.AssertArrayCount(videos, expectedCount)
	m.AssertArrayContainsAAs(videos, [{"type":videoType}])
	
	expectedIds = []
	for each id in videoIds
	  expectedIds.push({"id": id})
	end for
	
	m.AssertArrayContainsAAs(videos, expectedIds)
end function

'@Only
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests getVideosRealExample
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test basic test
function VMT__getVideosRealExample_basic() as void
  returnJson = {}
  
  m.expectNone(m.httpService, "getJson", true)
  
  videos = m.module.getVideosRealExample("mp4")
end function


