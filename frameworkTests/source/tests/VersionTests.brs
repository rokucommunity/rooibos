'@TestSuite [VT] Version tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests versionCompare
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test
'@Params["0.1", "0.1", 0]
'@Params["1.0", "1.0", 0]
'@Params["1.0.0", "1.0.0", 0]
'@Params["1.0.1", "1.0.1", 0]
'@Params["0.1", "0.2", -1]
'@Params["1.0", "2.0", -1]
'@Params["1.0.0", "2.0.0", -1]
'@Params["2.0.0", "2.0.1", -1]
'@Params["0.2", "0.1", 1]
'@Params["2.0", "1.0", 1]
'@Params["2.0.0", "1.0.0", 1]
'@Params["2.0.1", "2.0.0", 1]
function VT_versionCompare(v1, v2, expected) as void
  m.assertEqual(Rooibos__versionCompare(v1, v2), expected)
end function
