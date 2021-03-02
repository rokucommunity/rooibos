<p align="center">
  <img src="images/logo.png" alt="Rooibos test framework" width="200" height="200"/>
</p>
<h3 align="center">
Simple, mocha-and junit inspired, flexible, fun Brightscript test framework for ROKU apps
</h3>
<p align="center">
  <img src="images/exampleImage.png" alt="Mocha test framework" />
</p>

[![Build Status](https://travis-ci.org/georgejecook/rooibos.svg?branch=master)](https://travis-ci.org/georgejecook/rooibos)
[![GitHub](https://img.shields.io/github/release/georgejecook/rooibos.svg?style=flat-square)](https://github.com/georgejecook/rooibos/releases)

## Links
 - **[Documentation](docs/index.md)**
 - **[API Documentaiton](https://georgejecook.github.io/rooibos)**
 - **[CHANGELOG](CHANGELOG.md)**
 - **[VSCode snippets](docs/vsCodeSnippets.md)**
 - [Roku dev forum topic](https://forums.roku.com/viewforum.php?f=34)
 - \#roku channel on the [roku developer's slack](https://join.slack.com/t/rokudevelopers/shared_invite/enQtMzgyODg0ODY0NDM5LTc2ZDdhZWI2MDBmYjcwYTk5MmE1MTYwMTA2NGVjZmJiNWM4ZWY2MjY1MDY0MmViNmQ1ZWRmMWUzYTVhNzJiY2M)
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

Yes, it's been used in production by quite a few folks, I'll provide a list in due-course; but there are 1000's of tests in production in some very respectable companies.


### Is Rooibos actively maintained?

I love rooibos, and always keep it up to date. I use it all the time.

### Why 4.0.0?

Rooibos now uses the excellent bsc compiler plugin mechanism to seamlessly integrate with the compiler and the vscode IDE extension. This is a breaking change - projects will require updates to work.