<a name="easily-integrate-into-any-ci-system"></a>
Rooibos does not have special test runners for outputting to files, or uploading to servers. However, that will not stop you integrating with your CI system.

Becuase the test output has a convenient status at the end of the output, you can simply parse the last line of output from the telnet session to ascertain if your CI build's test succeeded or failed.

It is pretty straightforward, from your ci to do the following:
  - build your test config, using bsc
  - deploy to your roku device, using [roku-deploy](https://github.com/rokucommunity/roku-deploy/blob/master/README.md) - you can put the settings for your device in the bsconfig-test file
  - telet into the box to retrieve the results

A more advanced way to do this is have a javascript, which does this for you, which I will add in due course.

## Coming soon

instructions on how to do this, using js

## Coming soon.

I am currently toying with integrating with : https://github.com/georgejecook/roku-test-automation/  - when that work is complete, roobis will be easy to run from CI, as we'll have a socket connection.
