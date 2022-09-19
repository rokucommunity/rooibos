<a name="generate-code-coverage"></a>

**THIS FEATURE IS NOT YET AVAILBALE - I WILL REENABLE THIS IN ROOIBOS 4.2** : If you want it sooner, I can tell you how to implement it - it's a cpl hours of work, I don't have time for right now.


Rooibos can measure and report the test coverage your unit tests are producing.

### Code coverage recording is desctructive!

#### WARNING - DO NOT run code coverage against your source folder!

Recording coverage means modifying your sources! you should only run the coverage on a project path pointing to a build folder _not_ your source.

These files should be cleaned and recopied _every time you run coverage_ or you will get compile errors/other undetermined behaviour.

#### WARNING - Running code coverage is slower and may crash your device

Running a code coverage report is a lot slower than a standard test, due to conitnual probing of your source. Only run coverage when needed. Also - be aware it will crash very tight loops, like inside of a while waiting on a port, which will in fact crash and hard reset your device.

### Recording coverage
To record coverage, set the `sourceFilePattern` to a glob matching (including and excluding) the files that should be included in your coverage report, and set the `isRecordingCodeCoverage` flag to true. Be careful to not include your test specs!!

An example, using a json config file is :

```
{
  TBD
	"sourceFilePattern": [
		"**/*.brs",
		"**/*.xml",
		"!**/tests/**/*.*",
		"!**/tests",
		"!**/rLog",
		"!**/rLog/**/*.*",
		"!**/rLogComponents",
		"!**/rLogComponents/**/*.*",
		"!**/rooibosDist.brs",
		"!**/rooibosFunctionMap.brs",
		"!**/TestsScene.brs",
		"!**/ThreadUtils.brs"
	],
	"testsFilePattern": [
		"**/tests/**/*.brs",
		"!**/rooibosDist.brs",
		"!**/rooibosFunctionMap.brs",
		"!**/TestsScene.brs"
	],
	"isRecordingCodeCoverage": true
}
```

This can be done, from the command line also, with the following command:

### How coverage works

TODO

#### Statement support

The following statements types are supported:

  - variable assignments
  - method calls
  - nested function definitions (i.e. functions inside of arrays, variable assignments, method call args, or associative arrays)
  - if statement conditions
  - blocks of code in if, else if, and else statements
  - for and while loops
  - print statements

The following statements are _not_ supported

  - goto
  - named lines (e.g. `myGotoLine:`)
  - else if conditions (these are coming real soon though)

### Coverage report

When your coverage test run finishes rooibos will print out:

```
+++++++++++++++++++++++++++++++++++++++++++
Code Coverage Report
+++++++++++++++++++++++++++++++++++++++++++

Total Coverage: 5.066445% (610/12040)
Files:  17/ 100

HIT FILES
---------
pkg:/components/ContentRetriever/ContentRetriever.brs: 2.461539% (8/325)
pkg:/components/Analytics/AnalyticsManager.brs: 3.125% (6/192)
pkg:/components/Service/AuthenticationService.brs: 3.532609% (13/368)
pkg:/components/Container/UserContainer/UserContainer.brs: 3.703704% (1/27)
pkg:/components/MaintenanceCheckTask/AppConfigurationTask.brs: 7.407407% (2/27)
pkg:/components/Storage/PersistentStorage.brs: 15.27778% (11/72)
pkg:/source/Analytics/AnalyticsVideoMixin.brs: 16.92308% (22/130)
pkg:/components/DeveloperService/DeveloperService.brs: 33.33334% (2/6)
pkg:/components/Log/Log.brs: 45% (9/20)
pkg:/source/Modules/BaseModule.brs: 55.55556% (5/9)
pkg:/source/Log.brs: 65% (13/20)
pkg:/source/Modules/DeepLinkingModule.brs: 76.92308% (50/65)
pkg:/components/GlobalInitializer/GlobalInitializer.brs: 79.64601% (90/113)
pkg:/source/Modules/RecommendationModule.brs: 84.9315% (186/219)
pkg:/source/Mixins/ParsingMixin.brs: 86.47343% (179/207)
pkg:/source/Mixins/SMCErrors.brs: 92.30769% (12/13)
pkg:/source/Analytics/AnalyticsConstants.brs: 100% (1/1)

MISSED FILES
------------
pkg:/components/CustomRowListItem/CustomItemGenres/CustomItemGenres.brs: MISS!
pkg:/components/StringUtils.brs: MISS!
pkg:/components/Core/Components/TabComponent/TabComponent.brs: MISS!
pkg:/components/Core/Components/NoKeyPressRowList.brs: MISS!
pkg:/components/Model/TabComponentContent.brs: MISS!
```

e.g.

![coverage output](./images/coverage.png)


  - Total coverage - % (num of hit lines/ num of trackable lines)
  - Files: num of hit files / total num of trackable files

Following is a list of all the hit files, and their coverage % and (hit lines/total lines)

Lastly the files that were not hit at all, during test execution.

The current implementation is capable of tracking lcov style statistics; to do this, run rooibos-cli with the arg `--printLcov` or add `"printLcov": true` to your gulp build.

In this case the lcov report is printed to the end of the console output. Thanks very much to @Ronen on the slack channel for this contribution!

The report is contained after the LCOV.INFO file. Given that that the console output could be saved, it should be trivial to watch the log output file, and update your lcov file after running your tests.

e.g.

![coverage output](./images/lcov.png)

