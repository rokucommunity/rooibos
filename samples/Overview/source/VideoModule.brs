function VideoModule(constants, httpService)
  
  return {
    'private vars
    constants_: constants
    httpService_: httpService
    
    'public api
    getVideos: getVideos_
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