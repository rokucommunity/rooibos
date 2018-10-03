function VideoModule(constants, httpService)
  
  return {
    'private vars
    constants_: constants
    httpService_: httpService
    
    'public api
    getVideos: getVideos_
    getVideosRealExample: getVideosRealExample_
  }
end function

function getVideos_(videoType) as Object
  videos = []
  
'  result = httpService.getJson("https://myVideos.com/videos", "5ffcceea5")
  videoCount = 3
  if (videoType = "mpg")
    videoCount = 2
  else if (videoType = "vp8")
    videoCount = 1
  end if
  
  for i = 0 to videoCount -1
    videos.push({id:"video_" + stri(i).trim(), "type":videoType})
  end for
  return videos
end function


function getVideosRealExample_(videoType) as Object
  videos = []

  result = m.httpService_.getJson("https://myVideos.com/videos/", videoType)
  
  if (type(result) = "roArray")
    for each video in result
      videos.push(video)
    end for
  end if
  
  return videos
end function




