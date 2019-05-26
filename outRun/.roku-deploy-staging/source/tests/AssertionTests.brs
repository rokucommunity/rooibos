'@TestSuite [RBSA] Rooibos assertion tests

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests basic assertions
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test Fail
function Simp_basic_Fail() as void

RBS_CC_2_reportLine(9, 1):   assertResult = m.Fail("reason")

RBS_CC_2_reportLine(11, 1):   isFail = m.currentResult.isFail
RBS_CC_2_reportLine(12, 1):   m.currentResult.Reset()

RBS_CC_2_reportLine(14, 1):   m.AssertFalse(assertResult)
RBS_CC_2_reportLine(15, 1):   m.AssertTrue(isFail)
end function

'@Test AssertTrue
'@Params[true, true]
'@Params[false, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertTrue(value, expectedAssertResult) as void

RBS_CC_2_reportLine(27, 1):   assertResult = m.AssertTrue(value)
RBS_CC_2_reportLine(28, 1):   isFail = m.currentResult.isFail
RBS_CC_2_reportLine(29, 1):   m.currentResult.Reset()

RBS_CC_2_reportLine(31, 1):   m.AssertEqual(assertResult, expectedAssertResult)
RBS_CC_2_reportLine(32, 1):   m.AssertEqual(isFail, not expectedAssertResult)
end function

'@Test AssertFalse
'@Params[false, true]
'@Params[true, false]
'@Params[invalid, false]
'@Params[0, false]
'@Params[1, false]
'@Params["test", false]
function Simp_basic_AssertFalse(value, expectedAssertResult) as void

RBS_CC_2_reportLine(44, 1):   assertResult = m.AssertFalse(value)

RBS_CC_2_reportLine(46, 1):   isFail = m.currentResult.isFail
RBS_CC_2_reportLine(47, 1):   m.currentResult.Reset()

RBS_CC_2_reportLine(49, 1):   m.AssertEqual(assertResult, expectedAssertResult)
RBS_CC_2_reportLine(50, 1):   m.AssertEqual(isFail, not expectedAssertResult)
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

RBS_CC_2_reportLine(76, 1):   assertResult = m.AssertArrayContainsAAs(items, expectedAAs)

RBS_CC_2_reportLine(78, 1):   isFail = m.currentResult.isFail
RBS_CC_2_reportLine(79, 1):   m.currentResult.Reset()

RBS_CC_2_reportLine(81, 1):   m.AssertFalse(assertResult)
RBS_CC_2_reportLine(82, 1):   m.AssertTrue(isFail)
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

RBS_CC_2_reportLine(96, 1):   assertResult = m.AssertArrayContainsAAs(items, expectedAAs)

RBS_CC_2_reportLine(98, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(100, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(101, 1):   m.AssertTrue(assertResult)
RBS_CC_2_reportLine(102, 1):   m.AssertFalse(isFail)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests global is present on testSuite
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@BeforeEach
function Simp_AssertGlobal_beforeEach() as void
RBS_CC_2_reportLine(111, 1):   m.beforeEachGlobal = m.global
end function

'@AfterEach
function Simp_AssertGlobal_afterEach() as void
RBS_CC_2_reportLine(116, 1):   m.afterEachGlobal = m.global
end function

'@Test global is in test
function Simp_AssertGlobalIsPassedIntoTest() as void
RBS_CC_2_reportLine(121, 1):   m.AssertNotInvalid(m.global)
end function

'@Test global is in before each and after each
function Simp_AssertGlobalIsPassedInto_beforeEach_and_afterEach() as void
RBS_CC_2_reportLine(126, 1):   m.AssertNotInvalid(m.global)
RBS_CC_2_reportLine(127, 1):   m.AssertNotInvalid(m.beforeEachGlobal)
RBS_CC_2_reportLine(128, 1):   m.AssertNotInvalid(m.afterEachGlobal)
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

RBS_CC_2_reportLine(143, 1):   assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
RBS_CC_2_reportLine(144, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(146, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(147, 1):   m.AssertTrue(assertResult)
RBS_CC_2_reportLine(148, 1):   m.AssertFalse(isFail)

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

RBS_CC_2_reportLine(166, 1):   assertResult = m.AssertArrayContainsOnlyValuesOfType(values, typeName)
RBS_CC_2_reportLine(167, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(169, 1):   isFail = m.currentResult.isFail
RBS_CC_2_reportLine(170, 1):   m.currentResult.Reset()

RBS_CC_2_reportLine(172, 1):   m.AssertFalse(assertResult)
RBS_CC_2_reportLine(173, 1):   m.AssertTrue(isFail)


end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests white spaces work with annotations
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'some comments to
'demonstrate
'@Test comments between tests
'that we can have comments
'between functions and tags
function Simp_whiteSpacing() as void
RBS_CC_2_reportLine(188, 1):   m.AssertTrue(true)
end function

'some comments to
'demonstrate
'@Test comments between tests with params
'@Params[1]

'@Params[2]
'that we can have comments
'@Params[3]
'between functions and tags
'@Params[4]

function Simp_whiteSpacing_params(value) as void
RBS_CC_2_reportLine(203, 1):   m.AssertTrue(true)
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

RBS_CC_2_reportLine(226, 1):   result = m.EqArray(values, values2)
RBS_CC_2_reportLine(227, 1):   m.AssertEqual(result, expected)

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

RBS_CC_2_reportLine(245, 1):   assertResult = m.AssertNotEmpty(values)
RBS_CC_2_reportLine(246, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(248, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(249, 1):   m.AssertTrue(assertResult)
RBS_CC_2_reportLine(250, 1):   m.AssertFalse(isFail)

end function

'@Test fail
'@Params[invalid]
'@Params[[]]
'@Params[{}]
'@Params[1]
'@Params[""]
function Simp_AssertNotEmpty_Fail(values) as void

RBS_CC_2_reportLine(262, 1):   assertResult = m.AssertNotEmpty(values)
RBS_CC_2_reportLine(263, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(265, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(266, 1):   m.AssertFalse(assertResult)
RBS_CC_2_reportLine(267, 1):   m.AssertTrue(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests AssertEmpty
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test pass
'@Params[[]]
'@Params[{}]
'@Params[""]
function Simp_AssertEmpty_Pass(values) as void

RBS_CC_2_reportLine(281, 1):   assertResult = m.AssertEmpty(values)
RBS_CC_2_reportLine(282, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(284, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(285, 1):   m.AssertTrue(assertResult)
RBS_CC_2_reportLine(286, 1):   m.AssertFalse(isFail)

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

RBS_CC_2_reportLine(302, 1):   assertResult = m.AssertEmpty(values)
RBS_CC_2_reportLine(303, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(305, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(306, 1):   m.AssertFalse(assertResult)
RBS_CC_2_reportLine(307, 1):   m.AssertTrue(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests expect
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test multi return values
function Simp_expect_multiValues()
RBS_CC_2_reportLine(317, 1):   obj = {}
RBS_CC_2_reportLine(318, 1):   m.expect(obj, "mockMethod", 5, invalid, {"multiResult": ["one", 2, invalid, "last"]}, true)

RBS_CC_2_reportLine(320, 1):   result = obj.mockMethod()
RBS_CC_2_reportLine(321, 1):   m.AssertEqual(result, "one")

RBS_CC_2_reportLine(323, 1):   result = obj.mockMethod()
RBS_CC_2_reportLine(324, 1):   m.AssertEqual(result, 2)

RBS_CC_2_reportLine(326, 1):   result = obj.mockMethod()
RBS_CC_2_reportLine(327, 1):   m.AssertEqual(result, invalid)

RBS_CC_2_reportLine(329, 1):   result = obj.mockMethod()
RBS_CC_2_reportLine(330, 1):   m.AssertEqual(result, "last")

RBS_CC_2_reportLine(332, 1):   result = obj.mockMethod()
RBS_CC_2_reportLine(333, 1):   m.AssertEqual(result, "last")

RBS_CC_2_reportLine(335, 1):   m.assertMocks()
RBS_CC_2_reportLine(336, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(338, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(339, 1):   m.AssertFalse(isFail)

end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests expect with overloaded expectOnce
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test simple test
function Simp_expect_multiExpect_success()
RBS_CC_2_reportLine(349, 1):   obj = {}
RBS_CC_2_reportLine(350, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(351, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(352, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(353, 1):   result1 = 1
RBS_CC_2_reportLine(354, 1):   result2 = 2
RBS_CC_2_reportLine(355, 1):   result3 = 3

RBS_CC_2_reportLine(357, 1):   m.expectOnce(obj, "mockMethod", [arg1], result1, true)
RBS_CC_2_reportLine(358, 1):   m.expectOnce(obj, "mockMethod", [arg2], result2, true)
RBS_CC_2_reportLine(359, 1):   m.expectOnce(obj, "mockMethod", [arg3], result3, true)

RBS_CC_2_reportLine(361, 1):   result = obj.mockMethod(arg1)
RBS_CC_2_reportLine(362, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(364, 1):   result = obj.mockMethod(arg2)
RBS_CC_2_reportLine(365, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(367, 1):   result = obj.mockMethod(arg3)
RBS_CC_2_reportLine(368, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(370, 1):   m.assertMocks()
RBS_CC_2_reportLine(371, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(373, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(374, 1):   m.AssertFalse(isFail)
end function


'@Test can set up multi expects on same method - one invocation with any args
function Simp_expect_multiExpect_success_oneCallsArgsNotTracked()
RBS_CC_2_reportLine(380, 1):   obj = {}
RBS_CC_2_reportLine(381, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(382, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(383, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(384, 1):   result1 = 1
RBS_CC_2_reportLine(385, 1):   result2 = 2
RBS_CC_2_reportLine(386, 1):   result3 = 3

RBS_CC_2_reportLine(388, 1):   m.expectOnce(obj, "mockMethod", [arg1], result1, true)
RBS_CC_2_reportLine(389, 1):   m.expectOnce(obj, "mockMethod", invalid, result2, true)
RBS_CC_2_reportLine(390, 1):   m.expectOnce(obj, "mockMethod", [arg3], result3, true)

RBS_CC_2_reportLine(392, 1):   result = obj.mockMethod(arg1)
RBS_CC_2_reportLine(393, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(395, 1):   result = obj.mockMethod("do not care about args", "used in invocation", 2)
RBS_CC_2_reportLine(396, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(398, 1):   result = obj.mockMethod(arg3)
RBS_CC_2_reportLine(399, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(401, 1):   m.assertMocks()
RBS_CC_2_reportLine(402, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(404, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(405, 1):   m.AssertFalse(isFail)

end function

'@Test can set up multi expects on same method - multi params
function Simp_expect_multiExpect_multi_args_success()
RBS_CC_2_reportLine(411, 1):   obj = {}
RBS_CC_2_reportLine(412, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(413, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(414, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(415, 1):   result1 = 1
RBS_CC_2_reportLine(416, 1):   result2 = 2
RBS_CC_2_reportLine(417, 1):   result3 = 3

RBS_CC_2_reportLine(419, 1):   m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
RBS_CC_2_reportLine(420, 1):   m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
RBS_CC_2_reportLine(421, 1):   m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

RBS_CC_2_reportLine(423, 1):   result = obj.mockMethod(arg1, arg2, arg3)
RBS_CC_2_reportLine(424, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(426, 1):   result = obj.mockMethod(arg2, arg3, arg1)
RBS_CC_2_reportLine(427, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(429, 1):   result = obj.mockMethod(arg3, arg2, arg1)
RBS_CC_2_reportLine(430, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(432, 1):   m.assertMocks()
RBS_CC_2_reportLine(433, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(435, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(436, 1):   m.AssertFalse(isFail)

end function

'@Test multi test, multi params with other expects
function Simp_expect_multiExpect_multi_args_others_success()
RBS_CC_2_reportLine(442, 1):   obj = {}
RBS_CC_2_reportLine(443, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(444, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(445, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(446, 1):   result1 = 1
RBS_CC_2_reportLine(447, 1):   result2 = 2
RBS_CC_2_reportLine(448, 1):   result3 = 3

RBS_CC_2_reportLine(450, 1):   m.expectOnce(obj, "anotherMockMethod", invalid, "another", true)
RBS_CC_2_reportLine(451, 1):   m.expectOnce(obj, "anotherMockMethod2", [1,2,3], "another2", true)
RBS_CC_2_reportLine(452, 1):   m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
RBS_CC_2_reportLine(453, 1):   m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
RBS_CC_2_reportLine(454, 1):   m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

RBS_CC_2_reportLine(456, 1):   result = obj.anotherMockMethod()
RBS_CC_2_reportLine(457, 1):   m.AssertEqual(result, "another")

RBS_CC_2_reportLine(459, 1):   result = obj.anotherMockMethod2(1, 2, 3)
RBS_CC_2_reportLine(460, 1):   m.AssertEqual(result, "another2")

RBS_CC_2_reportLine(462, 1):   result = obj.mockMethod(arg1, arg2, arg3)
RBS_CC_2_reportLine(463, 1):   m.AssertEqual(result, result)

RBS_CC_2_reportLine(465, 1):   result = obj.mockMethod(arg2, arg3, arg1)
RBS_CC_2_reportLine(466, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(468, 1):   result = obj.mockMethod(arg3, arg2, arg1)
RBS_CC_2_reportLine(469, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(471, 1):   m.assertMocks()
RBS_CC_2_reportLine(472, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(474, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(475, 1):   m.AssertFalse(isFail)

end function

'@Test multi test, multi params with other expects - fail others
function Simp_expect_multiExpect_multi_args_others_fail()
RBS_CC_2_reportLine(481, 1):   obj = {}
RBS_CC_2_reportLine(482, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(483, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(484, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(485, 1):   result1 = 1
RBS_CC_2_reportLine(486, 1):   result2 = 2
RBS_CC_2_reportLine(487, 1):   result3 = 3

RBS_CC_2_reportLine(489, 1):   m.expectOnce(obj, "anotherMockMethod", ["not passed"], "another", true)
RBS_CC_2_reportLine(490, 1):   m.expectOnce(obj, "anotherMockMethod2", [1,2,3], "another2", true)
RBS_CC_2_reportLine(491, 1):   m.expectOnce(obj, "mockMethod", [arg1, arg2, arg3], result1, true)
RBS_CC_2_reportLine(492, 1):   m.expectOnce(obj, "mockMethod", [arg2, arg3, arg1], result2, true)
RBS_CC_2_reportLine(493, 1):   m.expectOnce(obj, "mockMethod", [arg3, arg2, arg1], result3, true)

RBS_CC_2_reportLine(495, 1):   result = obj.anotherMockMethod()
RBS_CC_2_reportLine(496, 1):   m.AssertEqual(result, "another")

RBS_CC_2_reportLine(498, 1):   result = obj.anotherMockMethod2(1, 2, 3)
RBS_CC_2_reportLine(499, 1):   m.AssertEqual(result, "another2")

RBS_CC_2_reportLine(501, 1):   result = obj.mockMethod(arg1, arg2, arg3)
RBS_CC_2_reportLine(502, 1):   m.AssertEqual(result, result)

RBS_CC_2_reportLine(504, 1):   result = obj.mockMethod(arg2, arg3, arg1)
RBS_CC_2_reportLine(505, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(507, 1):   result = obj.mockMethod(arg3, arg2, arg1)
RBS_CC_2_reportLine(508, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(510, 1):   m.assertMocks()
RBS_CC_2_reportLine(511, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(513, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(514, 1):   m.AssertTrue(isFail)

end function

'@Test can set up multi expects on same method
'@Params["arg1_", "arg2", "arg3"]
'@Params["arg1", "arg2", "arg3_"]
'@Params["arg1", "arg2_", "arg3"]
'@Params["arg1", "arg2_", "arg3"]
'@Params["arg1_", "arg2_", "arg3"]
'@Params["arg1_", invalid, "arg3"]
function Simp_expect_multiExpect_fail(call1, call2, call3)
RBS_CC_2_reportLine(526, 1):   obj = {}
RBS_CC_2_reportLine(527, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(528, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(529, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(530, 1):   result1 = 1
RBS_CC_2_reportLine(531, 1):   result2 = 2
RBS_CC_2_reportLine(532, 1):   result3 = 3

RBS_CC_2_reportLine(534, 1):   m.expectOnce(obj, "mockMethod", [arg1], result1, true)
RBS_CC_2_reportLine(535, 1):   m.expectOnce(obj, "mockMethod", [arg2], result2, true)
RBS_CC_2_reportLine(536, 1):   m.expectOnce(obj, "mockMethod", [arg3], result3, true)

RBS_CC_2_reportLine(538, 1):   result = obj.mockMethod(call1)
RBS_CC_2_reportLine(539, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(541, 1):   result = obj.mockMethod(call2)
RBS_CC_2_reportLine(542, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(544, 1):   result = obj.mockMethod(call2)
RBS_CC_2_reportLine(545, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(547, 1):   m.assertMocks()
RBS_CC_2_reportLine(548, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(550, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(551, 1):   m.AssertTrue(isFail)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests overloaded expectOnce on different objects
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test success
function Simp_expect_multiExpect_differentOnj_success()
RBS_CC_2_reportLine(560, 1):   obj = {}
RBS_CC_2_reportLine(561, 1):   obj2 = {}
RBS_CC_2_reportLine(562, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(563, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(564, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(565, 1):   result1 = 1
RBS_CC_2_reportLine(566, 1):   result2 = 2
RBS_CC_2_reportLine(567, 1):   result3 = 3

RBS_CC_2_reportLine(569, 1):   m.expectOnce(obj, "mockMethod", [arg1], result1, true)
RBS_CC_2_reportLine(570, 1):   m.expectOnce(obj, "mockMethod", [arg2], result2, true)
RBS_CC_2_reportLine(571, 1):   m.expectOnce(obj2, "mockMethod", [arg3], result3, true)

RBS_CC_2_reportLine(573, 1):   result = obj.mockMethod(arg1)
RBS_CC_2_reportLine(574, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(576, 1):   result = obj.mockMethod(arg2)
RBS_CC_2_reportLine(577, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(579, 1):   result = obj2.mockMethod(arg3)
RBS_CC_2_reportLine(580, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(582, 1):   m.assertMocks()
RBS_CC_2_reportLine(583, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(585, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(586, 1):   m.AssertFalse(isFail)

end function

'@Test fail to match
function Simp_expect_multiExpect_differentOnj_fail()
RBS_CC_2_reportLine(592, 1):   obj = {}
RBS_CC_2_reportLine(593, 1):   obj2 = {}
RBS_CC_2_reportLine(594, 1):   arg1 = "arg1"
RBS_CC_2_reportLine(595, 1):   arg2 = "arg2"
RBS_CC_2_reportLine(596, 1):   arg3 = "arg3"
RBS_CC_2_reportLine(597, 1):   result1 = 1
RBS_CC_2_reportLine(598, 1):   result2 = 2
RBS_CC_2_reportLine(599, 1):   result3 = 3

RBS_CC_2_reportLine(601, 1):   m.expectOnce(obj, "mockMethod", [arg1], result1, true)
RBS_CC_2_reportLine(602, 1):   m.expectOnce(obj, "mockMethod", [arg2], result2, true)
RBS_CC_2_reportLine(603, 1):   m.expectOnce(obj2, "mockMethod", [arg3], result3, true)

RBS_CC_2_reportLine(605, 1):   result = obj.mockMethod(arg1)
RBS_CC_2_reportLine(606, 1):   m.AssertEqual(result, result1)

RBS_CC_2_reportLine(608, 1):   result = obj.mockMethod(arg2)
RBS_CC_2_reportLine(609, 1):   m.AssertEqual(result, result2)

RBS_CC_2_reportLine(611, 1):   result = obj2.mockMethod(arg3)
RBS_CC_2_reportLine(612, 1):   m.AssertEqual(result, result3)

RBS_CC_2_reportLine(614, 1):   m.assertMocks()
RBS_CC_2_reportLine(615, 1):   isFail = m.currentResult.isFail

RBS_CC_2_reportLine(617, 1):   m.currentResult.Reset()
RBS_CC_2_reportLine(618, 1):   m.AssertFalse(isFail)

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


'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_2_reportLine(lineNumber, reportType = 1)
  if m.global = invalid
    '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    return true
  else
    if m._rbs_ccn = invalid
     '? "Coverage maps are not created - creating now"
      if m.global._rbs_ccn = invalid
        '? "Coverage maps are not created - creating now"
          m.global.addFields({
            "_rbs_ccn": createObject("roSGnode", "CodeCoverage")
          })
      end if
      m._rbs_ccn = m.global._rbs_ccn
     end if
  end if

  m._rbs_ccn.entry = {"f":"2", "l":stri(lineNumber), "r":reportType}
  return true
end function
