<p align="center">
  <img src="images/logo.png" alt="Mocha test framework" width="200" height="200"/>
</p>
<h3 align="center">
Simple, mocha-inspired, flexible, fun Brightscript test framework for ROKU apps
</h3>
<p align="center">
  Version 0.2.0
</p>
<p align="center">
  <img src="images/exampleImage.png" alt="Mocha test framework" />
</p>

## Links
 - **[Youtube training videos](https://www.youtube.com/playlist?list=PLJRLV4QDx83vsYMD9bIs-cjoDXmNmO8Jv)**
 - **[Documentation](docs/index.md)**
 - **[API Documentaiton](https://georgejecook.github.io/rooibos)**
 - **[Release notes / History / Changes](CHANGELOG.md)**
 - [Roku dev forum topic](https://forums.roku.com/viewforum.php?f=34)
 - [Roku developer slack group](https://join.slack.com/t/rokudevelopers/shared_invite/enQtMzgyODg0ODY0NDM5LTc2ZDdhZWI2MDBmYjcwYTk5MmE1MTYwMTA2NGVjZmJiNWM4ZWY2MjY1MDY0MmViNmQ1ZWRmMWUzYTVhNzJiY2M)
 - [Issue tracker](https://github.com/georgejecook/rooibos/issues)
 - [Roadmap](ROADMAP.md)

## Development

Rooibos is an independent open-source project, maintained exclusively by volunteers.

You might want to help! Get in touch via the slack group, or raise issues.

## Thanks
Rooibos was hacked together from the official roku unit testing framework. I'd like to say a big thank you to the guys at roku who gave me permission to build upon their work. The original framework can be found here : [https://github.com/rokudev/unit-testing-framework](https://github.com/rokudev/unit-testing-framework)

Also thanks to the guys who made and maintain [mochaJs](https://mochajs.org/), on which many of my changes are based upon, as well as the structure of the documentation.

## FAQ
### Is Rooibos ready for production use?
Rooibos has so far been used on a couple of production projects, running CI with over 800 tests between them. It does however, use the same test running mechanism of the official roku unit testing framework, which has been in circulation for several years.

### Is Rooibos actively maintained?
I am actively invovled in Rooibos's development, and add more features and fixes on a weekly basis. You can expect rapid responses to issues.

### Why did you not just merge back your changes to roku's unit testing framework
1. It does rewrite quite a lot of the original unit test framework code, so I doubt that roku would've merged it all back any time soon
2. It's conceptually entirely different: e.g. using annotations instead of naming conventions and boiler-plate code, completely different test reporting output, assertions and test cases maintain their own state, runs in a scenegraph scene, to name but a few
3. It has many more features than the original framework, not limited to : node specific assertions, exact assertion line failure reporting, better error messaging, easier setup, groupings, only and ignore for tests, mocks and stubs, etc, etc
4. Being completely frank, I enjoy roku work and want to do more of it, so it's useful to me to own this project, rather than lose control and wait on other's to merge my changes. On that note, email me at george[AT]tantawowa.com, or pm me (georgejecook) on the roku slack group to discuss any roku development requirements
5. I poured a _lot_ of work into the project (> 100 hours and counting), and expect to continue to do so. If I own the project, then I can do what I want, when I want. That goes for you guys as well, so get in touch with feature requests and PR's :)

### Is Rooibos itself unit tested?
At this point, it's WIP. It is on the [roadmap](ROADMAP.md) though!

### Doens't rooibos use eval? that's bad right...?
The official roku unit test framework also uses eval : https://github.com/rokudev/unit-testing-framework/search?q=eval&unscoped_q=eval

However, should this ever pose a problem for whatever reason, I promise to provide a replacement mechanism. It will be a couple of hours for me to write a fix (I've meditated on it long and hard) and will result in an extra build step that will parse the test files, and create a build artifact, that will do the mappings for the eval use.

Your usage of rooibos is safe, now and in the future :)

