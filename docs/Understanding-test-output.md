Rooibos reports test output in an easy to read hiearhchical manner.

<a name="readable-test-output"></a>
Each test suite has it's own tree structure in the output, and in turn has branches for each group, then each test that was run.

### Success and Failure output
When a test passes, it is indicated by the presence of `Success` at the end of the line

![Simple test output](./images/simpleReportOutput.png)


When a test fails, it is indicated by a `-` in the trunk of the test output, and `Fail`, at the end of the line. In addition, failed tests contain a link to the line of the failed assertion, and the reason for the failure.

![Simple test output](./images/simpleFail.png)

### End of test report

At the end of the test report, you will get a report telling you how many tests ran, failed, crashed, and the time spent.

In addition, you get a simple to parse result as the last line of output, which makes it easy for you to ascertain the result for your Continuous Integration process.

![Simple test output](./images/endOfTest.png)