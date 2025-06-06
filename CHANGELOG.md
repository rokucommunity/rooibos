# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [5.15.7](https://github.com/rokucommunity/rooibos/compare/v5.15.6...v5.15.7) - 2025-04-16
### Changed
 - (chore) adopt keepachangelog format for this changelog fle moving forward
 - (chore) Migrate to Shared CI ([#327](https://github.com/rokucommunity/rooibos/pull/327))
 - (chore) Docs restructuring ([#331](https://github.com/rokucommunity/rooibos/pull/331))
 - (chore) Project restructure ([#332](https://github.com/rokucommunity/rooibos/pull/332))
### Fixed
 - bug with indentation during mocha diff comparison ([#334](https://github.com/rokucommunity/rooibos/pull/334))



#### [v5.15.6](https://github.com/rokucommunity/rooibos/compare/v6.0.0-alpha.44...v5.15.6)

- playing with creating stack traces for reporters on failed assertions [`#324`](https://github.com/rokucommunity/rooibos/pull/324)
- Bugfix/wrong line number for async tests [`#323`](https://github.com/rokucommunity/rooibos/pull/323)
- Fixed a bug where crashes in node tests would stall rooibos [`#322`](https://github.com/rokucommunity/rooibos/pull/322)
- Fixed a bunch of potential crashes due to prop name conflicts with native functions [`#319`](https://github.com/rokucommunity/rooibos/pull/319)
- Added the ability to have duplicate test names [`#317`](https://github.com/rokucommunity/rooibos/pull/317)
- Clean up test files [`#318`](https://github.com/rokucommunity/rooibos/pull/318)
- chore(deps): bump serialize-javascript and mocha in /bsc-plugin [`#316`](https://github.com/rokucommunity/rooibos/pull/316)
- Fix nested assertions causing compilation error when using `sub _` [`#314`](https://github.com/rokucommunity/rooibos/pull/314)
- Remove the ropm step, devs just need to do this manually [`#310`](https://github.com/rokucommunity/rooibos/pull/310)
- Bugfix/only annotation not always applied correctly [`#308`](https://github.com/rokucommunity/rooibos/pull/308)
- promises support in tests [`#307`](https://github.com/rokucommunity/rooibos/pull/307)
- Feature/mocha test reporter [`#305`](https://github.com/rokucommunity/rooibos/pull/305)
- Task/update framework folder to match structure on device [`#306`](https://github.com/rokucommunity/rooibos/pull/306)
- Cleaned up formatting [`852cd15`](https://github.com/rokucommunity/rooibos/commit/852cd15ea0d99cf7fafc6ff2531290c87ca3371b)
- more indentation clean up [`973d6f2`](https://github.com/rokucommunity/rooibos/commit/973d6f23c7304163fe35dc031cb64624217510d0)
- Fixed a bunch of potental crashes due to prop name conflicts with native functions [`0b23f1f`](https://github.com/rokucommunity/rooibos/commit/0b23f1f33a2c76254abdf67cd062374c4bd63d58)

#### [v6.0.0-alpha.44](https://github.com/rokucommunity/rooibos/compare/v6.0.0-alpha.41...v6.0.0-alpha.44)

> 7 February 2025

- Upgraded to BSCv1.0.0-alpha.44 and fixed issues [`#312`](https://github.com/rokucommunity/rooibos/pull/312)
- Alllll places need to not use local... double duh [`e54c95d`](https://github.com/rokucommunity/rooibos/commit/e54c95d93cabb8c5617c1443ae9b4d36794c43b8)
- Dont use local brighterscript, duh [`765fe82`](https://github.com/rokucommunity/rooibos/commit/765fe82b99931180909e1033a1adc826cc52c503)
- JSON formatting change [`92566db`](https://github.com/rokucommunity/rooibos/commit/92566db9826e0f710d8a9e5106b51e13e15a5a19)

#### [v6.0.0-alpha.41](https://github.com/rokucommunity/rooibos/compare/v6.0.0-alpha.40...v6.0.0-alpha.41)

> 20 October 2024

- update changelog for v6.0.0-alpha.41 [`48ba632`](https://github.com/rokucommunity/rooibos/commit/48ba632c3a9e6e2939d38c25de966724904cfc5d)
- Upgrade to bsc@1.0.0-alpha.41 [`77c002d`](https://github.com/rokucommunity/rooibos/commit/77c002d0834260d125fede0b2ac61114c9f58b3f)

#### [v6.0.0-alpha.40](https://github.com/rokucommunity/rooibos/compare/v6.0.0-alpha.39...v6.0.0-alpha.40)

> 20 October 2024

- Sets default types for `m.top` and `m.node` in BaseTestSuite [`#301`](https://github.com/rokucommunity/rooibos/pull/301)
- upgade to bsc@1.0.0-alpha.40 [`f318f70`](https://github.com/rokucommunity/rooibos/commit/f318f703db384b7813ef2d6cfbaa72f2151f58e8)
- update changelog for v6.0.0-alpha.40 [`92bb27b`](https://github.com/rokucommunity/rooibos/commit/92bb27be87bff56f665ddf34a75be09d4191e7f0)

#### [v6.0.0-alpha.39](https://github.com/rokucommunity/rooibos/compare/v6.0.0-alpha.38...v6.0.0-alpha.39)

> 3 October 2024

- Adds a CLI to Rooibos! [`#294`](https://github.com/rokucommunity/rooibos/pull/294)
- Adds a CLI to Rooibos (current version) [`#295`](https://github.com/rokucommunity/rooibos/pull/295)
- chore: release v5.14.0 [`e2d2a57`](https://github.com/rokucommunity/rooibos/commit/e2d2a574c78f2fa22f47427016437ee087653aaf)
- Update changelog for v6.0.0-alpha.39 [`38e3cbe`](https://github.com/rokucommunity/rooibos/commit/38e3cbe3309666ce5daac248def66f3d256ff29c)

#### [v6.0.0-alpha.38](https://github.com/rokucommunity/rooibos/compare/v5.15.5...v6.0.0-alpha.38)

> 1 October 2024

- Upgade to brighterscript@1.0.0-alpha.38 [`#299`](https://github.com/rokucommunity/rooibos/pull/299)
- Allow 5000ms for code coverage test [`#293`](https://github.com/rokucommunity/rooibos/pull/293)
- A few updates to simplify config [`#292`](https://github.com/rokucommunity/rooibos/pull/292)
- Upgrading to Brighterscript v1 [`#289`](https://github.com/rokucommunity/rooibos/pull/289)
- upgrade changelog for v6.0.0-alpha.38 [`9ac4db8`](https://github.com/rokucommunity/rooibos/commit/9ac4db87dea8db8821d0e91249e1cbd1786c15f7)

#### [v5.15.5](https://github.com/rokucommunity/rooibos/compare/v5.15.4...v5.15.5)

> 4 March 2025

- Fixed a bug where crashes in node tests would stall rooibos [`#322`](https://github.com/rokucommunity/rooibos/pull/322)
- chore: release v5.15.5 [`30e5ec4`](https://github.com/rokucommunity/rooibos/commit/30e5ec402229a0abdb6f7daa118656907c680bcd)

#### [v5.15.4](https://github.com/rokucommunity/rooibos/compare/v5.15.3...v5.15.4)

> 26 February 2025

- Fixed a bunch of potential crashes due to prop name conflicts with native functions [`#319`](https://github.com/rokucommunity/rooibos/pull/319)
- Fixed a bunch of potental crashes due to prop name conflicts with native functions [`0b23f1f`](https://github.com/rokucommunity/rooibos/commit/0b23f1f33a2c76254abdf67cd062374c4bd63d58)
- chore: release v5.15.4 [`023a363`](https://github.com/rokucommunity/rooibos/commit/023a36363a2dfc734d8eb0e922f270a68d698fd7)

#### [v5.15.3](https://github.com/rokucommunity/rooibos/compare/v5.15.2...v5.15.3)

> 24 February 2025

- Added the ability to have duplicate test names [`#317`](https://github.com/rokucommunity/rooibos/pull/317)
- Clean up test files [`#318`](https://github.com/rokucommunity/rooibos/pull/318)
- chore(deps): bump serialize-javascript and mocha in /bsc-plugin [`#316`](https://github.com/rokucommunity/rooibos/pull/316)
- Cleaned up formatting [`852cd15`](https://github.com/rokucommunity/rooibos/commit/852cd15ea0d99cf7fafc6ff2531290c87ca3371b)
- more indentation clean up [`973d6f2`](https://github.com/rokucommunity/rooibos/commit/973d6f23c7304163fe35dc031cb64624217510d0)
- File path standardization for test hashing [`e239045`](https://github.com/rokucommunity/rooibos/commit/e239045c69b2e0423e5c3bb7c24110d300d4521b)

#### [v5.15.2](https://github.com/rokucommunity/rooibos/compare/v5.15.1...v5.15.2)

> 17 February 2025

- Fix nested assertions causing compilation error when using `sub _` [`#314`](https://github.com/rokucommunity/rooibos/pull/314)
- Update unit test to account for this [`8c4d819`](https://github.com/rokucommunity/rooibos/commit/8c4d8194692cd72e22da6c0e9de7f42cd23ebed9)
- chore: release v5.15.2 [`6de914b`](https://github.com/rokucommunity/rooibos/commit/6de914bd51c970d05a53e0e6a21a4ea5018b204b)
- Fix lint error [`d55d1ee`](https://github.com/rokucommunity/rooibos/commit/d55d1ee4c0c18368082aa48f70c82773aecd5d51)

#### [v5.15.1](https://github.com/rokucommunity/rooibos/compare/v5.15.0...v5.15.1)

> 31 January 2025

- Remove the ropm step, devs just need to do this manually [`#310`](https://github.com/rokucommunity/rooibos/pull/310)
- chore: release v5.15.1 [`1655c55`](https://github.com/rokucommunity/rooibos/commit/1655c559aacbf17397049f47c461f55a2081846c)

#### [v5.15.0](https://github.com/rokucommunity/rooibos/compare/v5.14.0...v5.15.0)

> 28 January 2025

- Bugfix/only annotation not always applied correctly [`#308`](https://github.com/rokucommunity/rooibos/pull/308)
- promises support in tests [`#307`](https://github.com/rokucommunity/rooibos/pull/307)
- Feature/mocha test reporter [`#305`](https://github.com/rokucommunity/rooibos/pull/305)
- Task/update framework folder to match structure on device [`#306`](https://github.com/rokucommunity/rooibos/pull/306)
- chore: release v5.15.0 [`397403f`](https://github.com/rokucommunity/rooibos/commit/397403f77496dc41d84fe48a4c3fdb8d53fbd93f)

#### [v5.14.0](https://github.com/rokucommunity/rooibos/compare/v5.13.0...v5.14.0)

> 3 October 2024

- Adds a CLI to Rooibos (current version) [`#295`](https://github.com/rokucommunity/rooibos/pull/295)
- chore: release v5.14.0 [`e2d2a57`](https://github.com/rokucommunity/rooibos/commit/e2d2a574c78f2fa22f47427016437ee087653aaf)

#### [v5.13.0](https://github.com/rokucommunity/rooibos/compare/5.12.0...v5.13.0)

> 12 September 2024

- chore(deps): bump luxon from 1.28.0 to 1.28.1 [`#210`](https://github.com/rokucommunity/rooibos/pull/210)
- Fixed a bug where scope validations where incomplete for node tests [`#280`](https://github.com/rokucommunity/rooibos/pull/280)
- Changes for the migration of this repo to RokuCommunity org [`#286`](https://github.com/rokucommunity/rooibos/pull/286)
- Use an AA to index test suites [`#287`](https://github.com/rokucommunity/rooibos/pull/287)
- Bugfix/general fixes [`#284`](https://github.com/rokucommunity/rooibos/pull/284)
- addresses regression that prevents stubCall allowing non-function return values [`#283`](https://github.com/rokucommunity/rooibos/pull/283)
- Updated to node 16.20.2 [`#285`](https://github.com/rokucommunity/rooibos/pull/285)
- Allow custom test reporter [`#265`](https://github.com/rokucommunity/rooibos/pull/265)
- Fixed logs sometimes getting cut off at the end of running tests [`#279`](https://github.com/rokucommunity/rooibos/pull/279)
- Adjust implementation to fit with new proposal [`599e6ce`](https://github.com/rokucommunity/rooibos/commit/599e6ce0e02bd16f5ca6bc06ab16bb2a7ec8d1e2)
- chore: release v5.13.0 [`6c56e29`](https://github.com/rokucommunity/rooibos/commit/6c56e290073e0b707f174a978c1d7757e834ecb8)
- Switch reporter API to conform to new spec proposal, add `onBegin` and `onEnd` [`54aa936`](https://github.com/rokucommunity/rooibos/commit/54aa936382786b35823406b7d14e9d7a47f8f227)

#### [5.12.0](https://github.com/rokucommunity/rooibos/compare/5.11.0...5.12.0)

> 10 March 2024

- Fixed assertAsyncField params [`#278`](https://github.com/rokucommunity/rooibos/pull/278)
- Fixed async tests sometimes waiting the full timeout even though the … [`#276`](https://github.com/rokucommunity/rooibos/pull/276)
- Lcov fixes [`#274`](https://github.com/rokucommunity/rooibos/pull/274)
- Fix SGNode test generation [`#270`](https://github.com/rokucommunity/rooibos/pull/270)
- Fixed duplicate cur line injections [`#267`](https://github.com/rokucommunity/rooibos/pull/267)
- chore: release v5.12.0 [`b47c88e`](https://github.com/rokucommunity/rooibos/commit/b47c88e5af6b5d141a4784847933e59439aaedeb)
- Merge pull request #273 from georgejecook/faster-applcation-closing [`9471f48`](https://github.com/rokucommunity/rooibos/commit/9471f484b267545865671cb79d624e6b2abb4d6c)
- Fixed failed tests and upgraded brighterscript [`ffdc3ca`](https://github.com/rokucommunity/rooibos/commit/ffdc3ca5662af46c6586ff3f072ba2ac05080325)

#### [5.11.0](https://github.com/rokucommunity/rooibos/compare/5.10.0...5.11.0)

> 1 February 2024

- Code cov perf and bug fix in if statements [`#264`](https://github.com/rokucommunity/rooibos/pull/264)
- Added an api to fail tests with an exception [`#263`](https://github.com/rokucommunity/rooibos/pull/263)
- Reduce raw code statements [`#260`](https://github.com/rokucommunity/rooibos/pull/260)
- Updated annotations to be order agnostic [`#262`](https://github.com/rokucommunity/rooibos/pull/262)
- Feature/runtime global function mocking [`#259`](https://github.com/rokucommunity/rooibos/pull/259)
- Small formatter pass and code change to be formatter frendly [`#252`](https://github.com/rokucommunity/rooibos/pull/252)
- Updated default global excluded files [`#251`](https://github.com/rokucommunity/rooibos/pull/251)
- Updated annotations to be order agnositic [`3d24579`](https://github.com/rokucommunity/rooibos/commit/3d2457955f1ccfac3bea6a63ea342cc60750b2bc)
- chore: release v5.11.0 [`a360bd8`](https://github.com/rokucommunity/rooibos/commit/a360bd8de99bdc0221680251d74e496f8869b440)

#### [5.10.0](https://github.com/rokucommunity/rooibos/compare/5.9.1...5.10.0)

> 7 January 2024

- Fix Rooibos_init injection causing duplicate calls [`#247`](https://github.com/rokucommunity/rooibos/pull/247)
- Fix some sourcemap transpile issues [`#249`](https://github.com/rokucommunity/rooibos/pull/249)
- Added a config value to crash when a assert fails [`#248`](https://github.com/rokucommunity/rooibos/pull/248)
- chore: release v5.10.0 [`cfad0f5`](https://github.com/rokucommunity/rooibos/commit/cfad0f503e0b72fa371334d7398f71f07012e8d5)

#### [5.9.1](https://github.com/rokucommunity/rooibos/compare/5.9.0...5.9.1)

> 5 January 2024

- Update FileFactory.ts to move status labels down for better visibility [`#245`](https://github.com/rokucommunity/rooibos/pull/245)
- chore: release v5.9.1 [`f322b9a`](https://github.com/rokucommunity/rooibos/commit/f322b9a80110388b49c9e4a38084cf869e2f2dcf)

#### [5.9.0](https://github.com/rokucommunity/rooibos/compare/5.8.0...5.9.0)

> 4 January 2024

- fixes failing test [`#246`](https://github.com/rokucommunity/rooibos/pull/246)
- Junit test reporter [`#243`](https://github.com/rokucommunity/rooibos/pull/243)
- Chore/doc update [`#244`](https://github.com/rokucommunity/rooibos/pull/244)
- chore: release v5.9.0 [`a9711c7`](https://github.com/rokucommunity/rooibos/commit/a9711c7121f3a8824ac59804d210c4e6c6fd0353)
- Update index.md [`f8c7de2`](https://github.com/rokucommunity/rooibos/commit/f8c7de257340a9f2758486a7745585eaa0840726)
- Update index.md [`8c9e55a`](https://github.com/rokucommunity/rooibos/commit/8c9e55ad724f6683f93f434bdd0905a6e70985e6)

#### [5.8.0](https://github.com/rokucommunity/rooibos/compare/5.7.0...5.8.0)

> 25 October 2023

- WIP: adds support for expecting on global functions and namespace functions [`#241`](https://github.com/rokucommunity/rooibos/pull/241)
- added docs about rendezvous tracking config flag [`#242`](https://github.com/rokucommunity/rooibos/pull/242)
- fix spelling [`#239`](https://github.com/rokucommunity/rooibos/pull/239)
- fixes docs issue [`#238`](https://github.com/rokucommunity/rooibos/pull/238)
- fixes error that prevented namespaces being correctly resolved [`9dcfa58`](https://github.com/rokucommunity/rooibos/commit/9dcfa589168a36baf8e24c180d4120981d6e23cc)
- chore: release v5.8.0 [`e74d87f`](https://github.com/rokucommunity/rooibos/commit/e74d87f1e4c1350ded074181c9484692fffa0931)

#### [5.7.0](https://github.com/rokucommunity/rooibos/compare/5.6.2...5.7.0)

> 23 July 2023

- feat(core): add support for declaring tests as functions. Resolves #235 [`#236`](https://github.com/rokucommunity/rooibos/pull/236)
- Proposed fix for anonymous callback crash [`#234`](https://github.com/rokucommunity/rooibos/pull/234)
- feat(core): add support for declaring tests as functions. Resolves #235 (#236) [`#235`](https://github.com/rokucommunity/rooibos/issues/235)
- chore: release v5.7.0 [`be83282`](https://github.com/rokucommunity/rooibos/commit/be83282a18dd770dc60265af9d94a7499a1fda69)

#### [5.6.2](https://github.com/rokucommunity/rooibos/compare/5.6.1...5.6.2)

> 22 June 2023

- fix: fixes crash when merging groups in a node test [`#233`](https://github.com/rokucommunity/rooibos/pull/233)
- chore: release v5.6.2 [`c7d900d`](https://github.com/rokucommunity/rooibos/commit/c7d900deed69d109c9bf6a82ff15c190c22fb81c)

#### [5.6.1](https://github.com/rokucommunity/rooibos/compare/5.6.0...5.6.1)

> 7 June 2023

- Fix coverage files import [`#232`](https://github.com/rokucommunity/rooibos/pull/232)
- chore: release v5.6.1 [`58cef81`](https://github.com/rokucommunity/rooibos/commit/58cef81b1c8e679b78f50310e13c65fdb5936ffa)

#### [5.6.0](https://github.com/rokucommunity/rooibos/compare/5.5.3...5.6.0)

> 1 June 2023

- Adds release-it-stuff [`#231`](https://github.com/rokucommunity/rooibos/pull/231)
- docs: adds documentation for code coverage [`#230`](https://github.com/rokucommunity/rooibos/pull/230)
- Fix code coverage [`#209`](https://github.com/rokucommunity/rooibos/pull/209)
- chore: release v5.6.0 [`64ccfcb`](https://github.com/rokucommunity/rooibos/commit/64ccfcbd3f87bc9dd49b9752c7caab488f39422a)

#### [5.5.3](https://github.com/rokucommunity/rooibos/compare/5.5.2...5.5.3)

> 30 May 2023

- fix(runner): addresses crash on tests-scene [`#229`](https://github.com/rokucommunity/rooibos/pull/229)
- Release 5.5.3 [`7afe7bf`](https://github.com/rokucommunity/rooibos/commit/7afe7bf227ad20601535fce50955402adb8f4139)

#### [5.5.2](https://github.com/rokucommunity/rooibos/compare/5.5.1...5.5.2)

> 12 May 2023

- Feat/custom test scene [`#225`](https://github.com/rokucommunity/rooibos/pull/225)
- bump [`1f6a108`](https://github.com/rokucommunity/rooibos/commit/1f6a108fed26308f082cc6f1650e06c19ce0e03e)
- bump [`d366831`](https://github.com/rokucommunity/rooibos/commit/d366831cf587fe87faccb999ba3310be19f61eb3)

#### [5.5.1](https://github.com/rokucommunity/rooibos/compare/5.5.0...5.5.1)

> 11 May 2023

- Fix/compiler issues [`#224`](https://github.com/rokucommunity/rooibos/pull/224)
- bump [`d68258c`](https://github.com/rokucommunity/rooibos/commit/d68258c9e658cd2b03e49482e143b599cb0c34cc)

#### [5.5.0](https://github.com/rokucommunity/rooibos/compare/5.4.2...5.5.0)

> 6 May 2023

- Feat/async testing [`#223`](https://github.com/rokucommunity/rooibos/pull/223)
- [FLAG] Adds keepAppOpen flag [`#212`](https://github.com/rokucommunity/rooibos/pull/212)
- Fix build badge and fix readme formatting [`#218`](https://github.com/rokucommunity/rooibos/pull/218)
- Fix CI by NOT excluding package-lock [`#219`](https://github.com/rokucommunity/rooibos/pull/219)
- Fix formatting [`b8bd259`](https://github.com/rokucommunity/rooibos/commit/b8bd2593160256cdabfbc73cd5e84fd6b0dcb29a)
- bump [`5d92599`](https://github.com/rokucommunity/rooibos/commit/5d92599c98ffefea051538f2f3d875d686b74b65)
- Remove brackets from bare links [`52337f1`](https://github.com/rokucommunity/rooibos/commit/52337f126560dcb4c0f9715199fe9bb734e995e9)

#### [5.4.2](https://github.com/rokucommunity/rooibos/compare/5.4.1...5.4.2)

> 21 February 2023

- Fix/dont iteate m or top, dont loop too many times [`#216`](https://github.com/rokucommunity/rooibos/pull/216)

#### [5.4.1](https://github.com/rokucommunity/rooibos/compare/5.4.0...5.4.1)

> 21 February 2023

- bump [`4889580`](https://github.com/rokucommunity/rooibos/commit/48895803ea3c503b9fc7d139ade3269f061767e0)

#### [5.4.0](https://github.com/rokucommunity/rooibos/compare/5.3.6...5.4.0)

> 21 February 2023

- Fix/crash stagingdir [`#215`](https://github.com/rokucommunity/rooibos/pull/215)
- bump [`ddb57d4`](https://github.com/rokucommunity/rooibos/commit/ddb57d40c256e002dfb2e442a1c69dfec2222693)

#### [5.3.6](https://github.com/rokucommunity/rooibos/compare/5.3.5...5.3.6)

> 26 January 2023

- Renames global timer var for uniqueness [`#211`](https://github.com/rokucommunity/rooibos/pull/211)
- bump [`445521b`](https://github.com/rokucommunity/rooibos/commit/445521ba8801731fd628f3aab922cf74116ee509)

#### [5.3.5](https://github.com/rokucommunity/rooibos/compare/5.3.4...5.3.5)

> 23 December 2022

- Fix/add mc node support [`#208`](https://github.com/rokucommunity/rooibos/pull/208)

#### [5.3.4](https://github.com/rokucommunity/rooibos/compare/5.3.3...5.3.4)

> 22 December 2022

- fixes issue with creating main.brs file that would cause the entire project to go south [`#207`](https://github.com/rokucommunity/rooibos/pull/207)
- bump [`567940c`](https://github.com/rokucommunity/rooibos/commit/567940c5d17319bf792b61682a0cccf333cf20f0)
- bump to bsc 0.61.2 [`f0af100`](https://github.com/rokucommunity/rooibos/commit/f0af1004ff265e4c0bbaf39dd35914a551f73d69)

#### [5.3.3](https://github.com/rokucommunity/rooibos/compare/5.3.2...5.3.3)

> 21 December 2022

#### [5.3.2](https://github.com/rokucommunity/rooibos/compare/5.3.1...5.3.2)

> 21 December 2022

- support otherFake with expectedInvocations&gt;1 [`#199`](https://github.com/rokucommunity/rooibos/pull/199)
- Fix windows builds [`#205`](https://github.com/rokucommunity/rooibos/pull/205)
- bump [`058cb6f`](https://github.com/rokucommunity/rooibos/commit/058cb6fe6f48280991e2deda7fe92304b12dbec3)
- bump node version and CI OS versions [`13eb19b`](https://github.com/rokucommunity/rooibos/commit/13eb19bf2d1a9e653d9b38825c994a9e64e7741b)

#### [5.3.1](https://github.com/rokucommunity/rooibos/compare/5.3.0...5.3.1)

> 8 November 2022

- Fix - Remove "createNodefile" call duplicate [`#194`](https://github.com/rokucommunity/rooibos/pull/194)
- bump [`f2ae810`](https://github.com/rokucommunity/rooibos/commit/f2ae810cd9f9f3ea1ace19ada6d16bd87e70d556)
- bump [`b993d40`](https://github.com/rokucommunity/rooibos/commit/b993d400a8e8746e38f0fc56b3278e6ea0e9ddc8)

#### [5.3.0](https://github.com/rokucommunity/rooibos/compare/5.2.3...5.3.0)

> 4 November 2022

- Fix/update to bsc 0.59.0 [`#192`](https://github.com/rokucommunity/rooibos/pull/192)
- bump [`f47052f`](https://github.com/rokucommunity/rooibos/commit/f47052f5844c588c58194505e94614507b7d89d3)
- readme update [`eef1a37`](https://github.com/rokucommunity/rooibos/commit/eef1a3700f72e89ba851206deda0c44a7fbe9d15)

#### [5.2.3](https://github.com/rokucommunity/rooibos/compare/5.2.2...5.2.3)

> 26 September 2022

- Make "undent" a prod dependency [`#186`](https://github.com/rokucommunity/rooibos/pull/186)

#### [5.2.2](https://github.com/rokucommunity/rooibos/compare/5.2.1...5.2.2)

> 15 June 2022

- fix(asserts): fixes logic error in assertclass [`#179`](https://github.com/rokucommunity/rooibos/pull/179)
- bump [`f47052f`](https://github.com/rokucommunity/rooibos/commit/f47052f5844c588c58194505e94614507b7d89d3)

#### [5.2.1](https://github.com/rokucommunity/rooibos/compare/5.2.0...5.2.1)

> 13 June 2022

- Feat/allow pointers for assert class [`#178`](https://github.com/rokucommunity/rooibos/pull/178)
- bump [`5252308`](https://github.com/rokucommunity/rooibos/commit/52523081ce33b3c5e2ac016d07fc1a3c2415b65c)
- bump [`9784ac4`](https://github.com/rokucommunity/rooibos/commit/9784ac43142be2f96f9374003cdcab687b9475dd)
- bump [`ac34aca`](https://github.com/rokucommunity/rooibos/commit/ac34aca4061d58d779c97f2f0f52c5dc39cf6f0c)

#### [5.2.0](https://github.com/rokucommunity/rooibos/compare/5.1.1...5.2.0)

> 8 June 2022

#### [5.1.1](https://github.com/rokucommunity/rooibos/compare/5.1.0...5.1.1)

> 8 June 2022

- fix(stubs): do not update non-mockable objects, needlessly [`#177`](https://github.com/rokucommunity/rooibos/pull/177)
- bump [`e297fc9`](https://github.com/rokucommunity/rooibos/commit/e297fc9aa209545d10426ef85c7e38f67797c2ee)

#### [5.1.0](https://github.com/rokucommunity/rooibos/compare/5.0.3...5.1.0)

> 7 June 2022

- feature(stubs): rooibos will now automtically convert any object that requires stubbing into a stubbable object [`#176`](https://github.com/rokucommunity/rooibos/pull/176)

#### [5.0.3](https://github.com/rokucommunity/rooibos/compare/5.0.2...5.0.3)

> 25 May 2022

- fix(core): uses lifecycle hooks correctly, so as to not transpile files before enums and other bsc plugin tasks have occurred [`#175`](https://github.com/rokucommunity/rooibos/pull/175)
- bump [`3e23360`](https://github.com/rokucommunity/rooibos/commit/3e23360a2539ce31190589be096df1141c0733dc)
- bump [`1d3b0a8`](https://github.com/rokucommunity/rooibos/commit/1d3b0a87dcc36d1a541bec39032440c666ca501d)

#### [5.0.2](https://github.com/rokucommunity/rooibos/compare/5.0.1...5.0.2)

> 24 May 2022

- Fix/fix incorrect empty message [`#173`](https://github.com/rokucommunity/rooibos/pull/173)
- bump [`0ef4322`](https://github.com/rokucommunity/rooibos/commit/0ef43227f2a4dc3489e418ac1035b738577e8924)

#### [5.0.1](https://github.com/rokucommunity/rooibos/compare/5.0.0...5.0.1)

> 24 May 2022

- fix(core): fixes incorrect class name equality checks [`#172`](https://github.com/rokucommunity/rooibos/pull/172)

### [5.0.0](https://github.com/rokucommunity/rooibos/compare/4.8.2...5.0.0)

> 23 May 2022

- fix(asserts): improves like,and imrpoves output for types, across the board [`#171`](https://github.com/rokucommunity/rooibos/pull/171)
- Use AstEditor for all transpile modifications [`#159`](https://github.com/rokucommunity/rooibos/pull/159)
- bump [`2384504`](https://github.com/rokucommunity/rooibos/commit/23845045f2ca7ee75f7968103ddeb8782dd43ca5)
- bump [`0707ec8`](https://github.com/rokucommunity/rooibos/commit/0707ec8d79cba8ffc7f6ab1cc62e527283f3a21a)
- bump [`6367ded`](https://github.com/rokucommunity/rooibos/commit/6367ded9bdd4e1d4d3356140b7963972a343f4a3)

#### [4.8.2](https://github.com/rokucommunity/rooibos/compare/4.8.1...4.8.2)

> 9 May 2022

#### [4.8.1](https://github.com/rokucommunity/rooibos/compare/4.8.0...4.8.1)

> 9 May 2022

- Feat/update to bsc 0.49.0 [`#167`](https://github.com/rokucommunity/rooibos/pull/167)

#### [4.8.0](https://github.com/rokucommunity/rooibos/compare/4.7.0...4.8.0)

> 9 May 2022

- adds expectLastCallToThrowError so we can throw errors from fakes [`#166`](https://github.com/rokucommunity/rooibos/pull/166)
- Quality of life fixes [`#162`](https://github.com/rokucommunity/rooibos/pull/162)
- bump [`b04ee37`](https://github.com/rokucommunity/rooibos/commit/b04ee37e6f3eb2a0d5929200b8ffb47755564eb0)

#### [4.7.0](https://github.com/rokucommunity/rooibos/compare/4.6.1...4.7.0)

> 2 April 2022

- Feature/accept expect once with function param [`#157`](https://github.com/rokucommunity/rooibos/pull/157)
- adds callfunc once method [`#156`](https://github.com/rokucommunity/rooibos/pull/156)
- Update slack link [`#155`](https://github.com/rokucommunity/rooibos/pull/155)

#### [4.6.1](https://github.com/rokucommunity/rooibos/compare/4.6.0...4.6.1)

> 26 February 2022

- bump [`41bef28`](https://github.com/rokucommunity/rooibos/commit/41bef28ccde505873ef93e767432f2e30a429c38)

#### [4.6.0](https://github.com/rokucommunity/rooibos/compare/4.5.4...4.6.0)

> 26 February 2022

- chore: update to bsc 0.45.3 [`#152`](https://github.com/rokucommunity/rooibos/pull/152)
- fix(node-tests): fixes node tests not running [`#147`](https://github.com/rokucommunity/rooibos/pull/147)
- bump [`0c69f53`](https://github.com/rokucommunity/rooibos/commit/0c69f53d8fa97df6f70d263eb913e31158f26548)
- bump [`3b54696`](https://github.com/rokucommunity/rooibos/commit/3b54696a0be2dfa4997babeec3fc33490bdea9fa)

#### [4.5.4](https://github.com/rokucommunity/rooibos/compare/4.5.3...4.5.4)

> 12 January 2022

#### [4.5.3](https://github.com/rokucommunity/rooibos/compare/4.5.2...4.5.3)

> 12 January 2022

- fix: fixes equals failures [`#144`](https://github.com/rokucommunity/rooibos/pull/144)
- bump [`2864c66`](https://github.com/rokucommunity/rooibos/commit/2864c66adac94e3c2fa7fa1d565493617dcac08d)

#### [4.5.2](https://github.com/rokucommunity/rooibos/compare/4.5.1...4.5.2)

> 6 January 2022

- improves stringand float comparisons and assert not invalid message [`#142`](https://github.com/rokucommunity/rooibos/pull/142)

#### [4.5.1](https://github.com/rokucommunity/rooibos/compare/4.5.0...4.5.1)

> 5 January 2022

- Feat/add home press flag [`#140`](https://github.com/rokucommunity/rooibos/pull/140)
- bump [`ef9d022`](https://github.com/rokucommunity/rooibos/commit/ef9d022bb628217275486a08de170b609b2374c1)

#### [4.5.0](https://github.com/rokucommunity/rooibos/compare/4.4.2...4.5.0)

> 5 January 2022

- Fix/doc improvements [`#139`](https://github.com/rokucommunity/rooibos/pull/139)
- Fix/doc improvements [`#138`](https://github.com/rokucommunity/rooibos/pull/138)
- bump [`59155f1`](https://github.com/rokucommunity/rooibos/commit/59155f1f48cd8f27bd35b5f89e564ba08c509eac)

#### [4.4.2](https://github.com/rokucommunity/rooibos/compare/4.4.1...4.4.2)

> 17 September 2021

- fix: removes erroneous file [`920770a`](https://github.com/rokucommunity/rooibos/commit/920770aefa981062455f25d11181fbb51d5764ae)
- bump [`261900c`](https://github.com/rokucommunity/rooibos/commit/261900c430d44850cc564661b111ae18468a160b)
- bump [`44bc98d`](https://github.com/rokucommunity/rooibos/commit/44bc98d0dc994d2e200051503b97636f2538bacc)

#### [4.4.1](https://github.com/rokucommunity/rooibos/compare/4.3.2...4.4.1)

> 30 August 2021

- Feat/adds flag to allow skipping some fields on iterative equals [`#135`](https://github.com/rokucommunity/rooibos/pull/135)
- Clutch of fixes [`#134`](https://github.com/rokucommunity/rooibos/pull/134)
- version bump [`865cccf`](https://github.com/rokucommunity/rooibos/commit/865cccf83f56f8445b76a6588c76633bbdc6ffd5)
- version bump [`894cdf0`](https://github.com/rokucommunity/rooibos/commit/894cdf0b63783301d517380eeb23532935606624)

#### [4.3.2](https://github.com/rokucommunity/rooibos/compare/4.3.1...4.3.2)

> 19 May 2021

- chore: fix docs [`#132`](https://github.com/rokucommunity/rooibos/pull/132)
- remove travis [`#130`](https://github.com/rokucommunity/rooibos/pull/130)

#### [4.3.1](https://github.com/rokucommunity/rooibos/compare/4.2.1...4.3.1)

> 19 May 2021

- chore: update docs [`#131`](https://github.com/rokucommunity/rooibos/pull/131)
- Beta [`#121`](https://github.com/rokucommunity/rooibos/pull/121)
- add workflow [`4b235e9`](https://github.com/rokucommunity/rooibos/commit/4b235e93175fb52763687c3c8f128672565b89d5)
- version bump [`a064344`](https://github.com/rokucommunity/rooibos/commit/a06434458cf3f25fd84d2c06af677addf1efcfae)
- version bump [`e048ebf`](https://github.com/rokucommunity/rooibos/commit/e048ebff7a2be252abe18b0e816b1d3474cee5ed)

#### [4.2.1](https://github.com/rokucommunity/rooibos/compare/4.1.1...4.2.1)

> 22 April 2021

- fix(framework): Fixes framework tests [`7008e9d`](https://github.com/rokucommunity/rooibos/commit/7008e9de1f21c78948a58eafdf3c7a799f0b454c)
- version bump [`a5dc306`](https://github.com/rokucommunity/rooibos/commit/a5dc30636e911744c57912619603fc641c33ea90)
- doc improvements [`58d3c7a`](https://github.com/rokucommunity/rooibos/commit/58d3c7a1d957a82788fb9ea09202ba6a7765464c)

#### [4.1.1](https://github.com/rokucommunity/rooibos/compare/4.1.0...4.1.1)

> 1 March 2021

- adds scripts for easy remote/local npm switching [`c033761`](https://github.com/rokucommunity/rooibos/commit/c033761afcf5958228b16fe62cfd6cbc05e3b1a5)
- compile against latest bsc [`7d2c187`](https://github.com/rokucommunity/rooibos/commit/7d2c187b61fec2da6fc4618018c570cbc1a29f93)

#### [4.1.0](https://github.com/rokucommunity/rooibos/compare/4.0.6...4.1.0)

> 23 February 2021

- feat: improves handling of errors in assertions [`f80d19b`](https://github.com/rokucommunity/rooibos/commit/f80d19b405477f7fc46005b42eb49969818c6087)
- bump to 4.1.1 [`f349941`](https://github.com/rokucommunity/rooibos/commit/f349941c4934f9f430670ccb65990e0bfa2b09de)
- bunch of fixes [`d95a506`](https://github.com/rokucommunity/rooibos/commit/d95a50601520a33286123d1c837fe8102e9dcbb1)

#### [4.0.6](https://github.com/rokucommunity/rooibos/compare/4.0.0...4.0.6)

> 11 February 2021

- feat(framework-tests): Improve framework tests by making it a bsc compiled app, so that it servers of an example of how to use rooibos with bsc [`#114`](https://github.com/rokucommunity/rooibos/pull/114)
- first stab at moving over to ropm [`81b9e8f`](https://github.com/rokucommunity/rooibos/commit/81b9e8f18c5005405ee7e303890e12735b3c05b7)
- refactoring to reflect new plugin-driven pattenr [`32faa19`](https://github.com/rokucommunity/rooibos/commit/32faa192158081b8c2f325236dfc9592b377c610)
- adds linting and testing setup. Thanks Bronley Plumb [`cab1266`](https://github.com/rokucommunity/rooibos/commit/cab12663620fabddf11c6e84632d0afb400e9ff8)

### [4.0.0](https://github.com/rokucommunity/rooibos/compare/3.6.1...4.0.0)

> 12 June 2020

- Chore/move to new bs compiler [`#106`](https://github.com/rokucommunity/rooibos/pull/106)
- bump to 4.0.0 [`a8eb8ac`](https://github.com/rokucommunity/rooibos/commit/a8eb8acaede9a40d1a97733e73666bfd176bbbd7)
- chore(docs): adds missing logo [`2101474`](https://github.com/rokucommunity/rooibos/commit/2101474ebc5106bd0c74be3bcfac2110e75c4d71)
- Update logos [`ea3200f`](https://github.com/rokucommunity/rooibos/commit/ea3200f78b9d8bd1c7ceed01588e47111bbfa48c)

#### [3.6.1](https://github.com/rokucommunity/rooibos/compare/3.6.0...3.6.1)

> 21 May 2020

- chore(tests): Adds node test to framework suite, and also improves the file structure to include placeholder files, so as to better conform with brighterscript compiler [`f23b81d`](https://github.com/rokucommunity/rooibos/commit/f23b81d8e34a6e0e86af84dc2441d0755bb5eba2)
- chore(core): bump to 3.6.1 [`167fab1`](https://github.com/rokucommunity/rooibos/commit/167fab1bca39a381201664ffb4ca3d6132bfc4b3)
- fix(TestRunner): Adds more logoutput when a node test does not complete [`c4277d6`](https://github.com/rokucommunity/rooibos/commit/c4277d66779b7b6c9f77cbc71c74d60e7668dfb1)

#### [3.6.0](https://github.com/rokucommunity/rooibos/compare/3.5.1...3.6.0)

> 21 May 2020

- feat(assertions): adds support for async fields [`28f3275`](https://github.com/rokucommunity/rooibos/commit/28f32754daee7d4adef7a4e18baa0d6af07653f9)
- chore(docs): add async assert docs [`6261e55`](https://github.com/rokucommunity/rooibos/commit/6261e551f1e6a3ad92eef07d2236c203141fa0ec)
- chore(core): bump to 3.6.0 [`660926b`](https://github.com/rokucommunity/rooibos/commit/660926bb0d72997916863877d51c3e5b61da44c5)

#### [3.5.1](https://github.com/rokucommunity/rooibos/compare/3.5.0...3.5.1)

> 20 May 2020

- fix(TestRunner): Addresses issue that prevented node tests from correctly running [`c6aec59`](https://github.com/rokucommunity/rooibos/commit/c6aec599edd1e61cf90634a5bf718af1f02560d1)
- bump to 3.5.1 [`a08fff6`](https://github.com/rokucommunity/rooibos/commit/a08fff6d25cc1d4a783dce15eac4d7f402adf676)

#### [3.5.0](https://github.com/rokucommunity/rooibos/compare/3.4.3...3.5.0)

> 20 May 2020

- feat(runner): adds ability to wait on scene.isReadyToStartTests, if present before starting the tests [`c1b71a9`](https://github.com/rokucommunity/rooibos/commit/c1b71a9a6f7b8e4e974ecf33d4928d3b249b2532)
- fix(mocks): Better handling for mock creation failures [`df74e3b`](https://github.com/rokucommunity/rooibos/commit/df74e3b52caf42ae9f8439a92694c7c36a7a827c)
- bump to 3.5.0 [`6246d42`](https://github.com/rokucommunity/rooibos/commit/6246d420a0fa0a8e67f0e826487cb047bc99316d)

#### [3.4.3](https://github.com/rokucommunity/rooibos/compare/3.4.2...3.4.3)

> 10 May 2020

- bound to 3.4.3 [`c217996`](https://github.com/rokucommunity/rooibos/commit/c2179965364b0d85e5ba0af97c7d88d891656abe)
- hotfix for wln error [`b30d44e`](https://github.com/rokucommunity/rooibos/commit/b30d44e55e0b18e5842747562af06a584f0cb8af)
- fix(mocks): Fixes crash on multi expect [`e02f96c`](https://github.com/rokucommunity/rooibos/commit/e02f96cab091fc6a0d622f85b7302d7c48480aca)

#### [3.4.2](https://github.com/rokucommunity/rooibos/compare/3.4.1...3.4.2)

> 7 May 2020

- feat(mocks):adds shadow methods to facilitate mock failure line number reporting [`d1e652c`](https://github.com/rokucommunity/rooibos/commit/d1e652cc9a622b7c3ee7bd86937d5b826ea08dc3)
- chore: bounce to 3.4.2 [`cc2c559`](https://github.com/rokucommunity/rooibos/commit/cc2c5598ab88def1d2dd93f35b8459b542959329)

#### [3.4.1](https://github.com/rokucommunity/rooibos/compare/3.4.0...3.4.1)

> 5 May 2020

- bounce to 3.4.1 [`f9c4935`](https://github.com/rokucommunity/rooibos/commit/f9c4935b4337b41d3fb69a666c95f6be40e1735c)
- updates version.txt [`ae130f3`](https://github.com/rokucommunity/rooibos/commit/ae130f393a9df1014b8683c233f5f20603ff0e6f)
- fix(core): minor logger fix [`61ee811`](https://github.com/rokucommunity/rooibos/commit/61ee81136a609586c96e553ea49ab7828c7424fa)

#### [3.4.0](https://github.com/rokucommunity/rooibos/compare/3.3.0...3.4.0)

> 4 May 2020

- Feature/option to remove test times [`#82`](https://github.com/rokucommunity/rooibos/pull/82)
- add option to not print test times [`#80`](https://github.com/rokucommunity/rooibos/pull/80)
- Regenerates package-lock.json [`bf210cd`](https://github.com/rokucommunity/rooibos/commit/bf210cd60062f04e807735dc8f2f772f786273ce)
- feat(core): Adds lcov report, and moves test files to brighterscript [`99b8d50`](https://github.com/rokucommunity/rooibos/commit/99b8d50a7c0668c0bca29eedfdc190ebe10ff7e7)
- feat: lcov support [`0cfb918`](https://github.com/rokucommunity/rooibos/commit/0cfb91813587fb26a7be1e3f64ad798be2e86b83)

#### [3.3.0](https://github.com/rokucommunity/rooibos/compare/3.2.2...3.3.0)

> 26 September 2019

- feat: Increase mocks limit to 25 - it is now possible to create up to 25 mocks for a given test suite. [`#73`](https://github.com/rokucommunity/rooibos/pull/73)
- chore:adds changelog generator to dependencies [`22a2530`](https://github.com/rokucommunity/rooibos/commit/22a25308cd4d448c4cdd01087dc43cda74ca82d5)
- fix: fixes incorrect reporting of version numbers during test run [`e820831`](https://github.com/rokucommunity/rooibos/commit/e820831823993e33a6581926701d8263f7826fc4)
- bounc to 3.3.0 [`7652747`](https://github.com/rokucommunity/rooibos/commit/7652747a5f3ec52b5126c18f3b8f96271ec3d3f2)

#### [3.2.2](https://github.com/rokucommunity/rooibos/compare/3.2.1...3.2.2)

> 22 September 2019

- version bounce, remove file that should not be scm [`0e60d54`](https://github.com/rokucommunity/rooibos/commit/0e60d549504dda61ed53b3cb55aa005c20b123ca)
- fix: fixes incorrect reporting of version numbers during test run [`e3f8810`](https://github.com/rokucommunity/rooibos/commit/e3f88108f3b09d21f487b04a9afcd53861a21219)
- ignore generated dist file in sample project [`ff2a592`](https://github.com/rokucommunity/rooibos/commit/ff2a59230d77a447f1c9083004eda1c57f7ea9c2)

#### [3.2.1](https://github.com/rokucommunity/rooibos/compare/3.2.0...3.2.1)

> 22 September 2019

- fix: fixes regression in node tests [`7b63c69`](https://github.com/rokucommunity/rooibos/commit/7b63c69ecacdd26d6d9b067b46eb56908ae869e7)
- bounce to 3.2.1 [`07067e4`](https://github.com/rokucommunity/rooibos/commit/07067e4ea3f3ddc74afe72fa46c89231f2521154)
- chore: add bash task to run gulp, coz vscode ide keeps opening a gulp tab [`c7a45ad`](https://github.com/rokucommunity/rooibos/commit/c7a45ad2160fd3c7c31a7ccf692440ad7ec7391b)

#### [3.2.0](https://github.com/rokucommunity/rooibos/compare/3.1.1...3.2.0)

> 22 September 2019

- feat: migrate to using brighterscript, via maestro project's compiler [`391b902`](https://github.com/rokucommunity/rooibos/commit/391b902c82b63a261a73f452879fbde72eb57ae0)
- chore: adds documentation for matchers [`ef79171`](https://github.com/rokucommunity/rooibos/commit/ef791711abe87a02ee5c935aa5ac34f178cdf6e3)
- feat: adds matchers for mocks, you can now use built in anyXXXMatchers, or roll your own as function pointers, or inline functions [`f87609e`](https://github.com/rokucommunity/rooibos/commit/f87609e5c1e0dc0b532333be4d6971755d3af229)

#### [3.1.1](https://github.com/rokucommunity/rooibos/compare/3.1.0...3.1.1)

> 10 August 2019

- fixes compatability issues with rooibos cli [`#68`](https://github.com/rokucommunity/rooibos/pull/68)
- adds version task to gulp file and fixes docs [`815a61f`](https://github.com/rokucommunity/rooibos/commit/815a61f39033d85b33d55fbba4b986008a30c7f4)
- updates version to 3.1.1 [`0a11e3d`](https://github.com/rokucommunity/rooibos/commit/0a11e3dbd4339983763a40ced892afc6bd1d92a5)
- updates docs [`f2d9a1a`](https://github.com/rokucommunity/rooibos/commit/f2d9a1ab112e6aa0f54758d880b3125b224b0c9b)

#### [3.1.0](https://github.com/rokucommunity/rooibos/compare/3.0.4...3.1.0)

> 18 July 2019

- Feature/check version [`#66`](https://github.com/rokucommunity/rooibos/pull/66)
- adds legacy support [`#61`](https://github.com/rokucommunity/rooibos/pull/61)
- adds checks for version [`17b9d83`](https://github.com/rokucommunity/rooibos/commit/17b9d83ba717911672ba8adc6ae83c58f01d6c60)
- some format fixes [`745af9c`](https://github.com/rokucommunity/rooibos/commit/745af9c9ae0170d1db5f15f79ae78e7f451b907a)
- some format fixes [`dba439c`](https://github.com/rokucommunity/rooibos/commit/dba439c7fc26721d434322aea4f2e19abb460cf2)

#### [3.0.4](https://github.com/rokucommunity/rooibos/compare/3.0.3...3.0.4)

> 23 June 2019

- adds legacy support documentation [`a1fc451`](https://github.com/rokucommunity/rooibos/commit/a1fc4515d7abc542f834d53f4260903c69b2ff74)
- fix borked formatting on rooibosC args table in the docs [`464b9cf`](https://github.com/rokucommunity/rooibos/commit/464b9cf71da4915d62b821f16d9f6d325dc204fc)

#### [3.0.3](https://github.com/rokucommunity/rooibos/compare/3.0.2-beta...3.0.3)

> 4 June 2019

- Feature/move json config [`#54`](https://github.com/rokucommunity/rooibos/pull/54)
- bounce to 3.0.3 [`3c81064`](https://github.com/rokucommunity/rooibos/commit/3c8106406baaff619ad216ff8a062e8407256709)
- runtime config is now provided by rooibosC [`774ade1`](https://github.com/rokucommunity/rooibos/commit/774ade1ec8740fbb15d4025cd607674224bebab6)
- fix for box crash on asString when used on an aa with mock methods [`8367146`](https://github.com/rokucommunity/rooibos/commit/8367146f8f6a13e1183fb23aa6da92cc8253a14b)

#### [3.0.2-beta](https://github.com/rokucommunity/rooibos/compare/3.0.1-beta...3.0.2-beta)

> 28 May 2019

- adds path to test suite output [`73f0d17`](https://github.com/rokucommunity/rooibos/commit/73f0d17a673d0ebd9f28e9e8ffb5be7721b6d4e7)

#### [3.0.1-beta](https://github.com/rokucommunity/rooibos/compare/3.0.0-beta...3.0.1-beta)

> 27 May 2019

- improves docs for code coverage [`f388804`](https://github.com/rokucommunity/rooibos/commit/f388804f410b069b7a99d9fd6d7ee3a9fec07a55)

#### [3.0.0-beta](https://github.com/rokucommunity/rooibos/compare/2.3.0...3.0.0-beta)

> 25 May 2019

- Feature/code coverage [`#46`](https://github.com/rokucommunity/rooibos/pull/46)
- fix #45 [`#45`](https://github.com/rokucommunity/rooibos/issues/45)
- Revert "remove files that should not be checked in" [`9c2ece6`](https://github.com/rokucommunity/rooibos/commit/9c2ece66a88976cee6e4abbd908f6755083cad89)
- remove files that should not be checked in [`3e4ecdb`](https://github.com/rokucommunity/rooibos/commit/3e4ecdb7127c487a949b268dedb1a0bf7b53c431)
- remove folder which should not be added [`ba257a5`](https://github.com/rokucommunity/rooibos/commit/ba257a588a369592e360df58b8a4dbb1bf399c16)

#### [2.3.0](https://github.com/rokucommunity/rooibos/compare/2.2.0...2.3.0)

> 27 April 2019

- doc update [`e9d7a40`](https://github.com/rokucommunity/rooibos/commit/e9d7a40aaf9ab21d9eef42de77100ccd60774ea2)
- 2.3.0 - adds ms time for each test in the test output [`f960e52`](https://github.com/rokucommunity/rooibos/commit/f960e521b39d07543d987dd7e247a4b6e45638a6)

#### [2.2.0](https://github.com/rokucommunity/rooibos/compare/2.1.4...2.2.0)

> 26 April 2019

- 2.2.0 - adds ability to pass node scope into the test runner, for non-node tests so node-scoped functions/vars can be accessed [`67527eb`](https://github.com/rokucommunity/rooibos/commit/67527eb009feeff109979146c81d177ea7ce8b14)

#### [2.1.4](https://github.com/rokucommunity/rooibos/compare/2.1.3...2.1.4)

> 26 April 2019

- 2.1.4 adds paramter directive to allow creation of nodes [`189b1be`](https://github.com/rokucommunity/rooibos/commit/189b1be7425455b6d55afe09e81dd267102f0f12)
- minor doc update [`b22363d`](https://github.com/rokucommunity/rooibos/commit/b22363d93e08eb1aa4e951c835138543650340c7)

#### [2.1.3](https://github.com/rokucommunity/rooibos/compare/2.1.2...2.1.3)

> 25 April 2019

- Feature/update to use latest rooibos c [`#41`](https://github.com/rokucommunity/rooibos/pull/41)
- improved docs for updated rooibos preprocessor [`fd48ffe`](https://github.com/rokucommunity/rooibos/commit/fd48ffee19c67c0519157e994d88b0e891959217)
- fix typo [`0fc3fc0`](https://github.com/rokucommunity/rooibos/commit/0fc3fc0265bd041bcba96bd3fea6aedb75f7fe9b)
- update changelog [`1e9f8f4`](https://github.com/rokucommunity/rooibos/commit/1e9f8f4d03a24fcb40c26b7ad75928065e20fb90)

#### [2.1.2](https://github.com/rokucommunity/rooibos/compare/2.1.1...2.1.2)

> 21 March 2019

- Bugfix/overloaded expects collide on same method name on different objects [`#39`](https://github.com/rokucommunity/rooibos/pull/39)
- formats base test suite, and addresses issue of overriding mocks colliding on method name across different objects [`297fcfa`](https://github.com/rokucommunity/rooibos/commit/297fcfa6ebb586be784fa045e14cee8d9d9cdfc5)
- doc update [`01e4df0`](https://github.com/rokucommunity/rooibos/commit/01e4df04d154d7eec7d62ad474be61f7550066fa)
- adds additinoaly testing to ensure that there were no regressions on non-overloaded expects mixed with overloaded ones [`9d0015c`](https://github.com/rokucommunity/rooibos/commit/9d0015c85facf0381341b0c75329bc9ac519b92a)

#### [2.1.1](https://github.com/rokucommunity/rooibos/compare/2.1.0...2.1.1)

> 21 March 2019

- Bugfix/minor issues [`#35`](https://github.com/rokucommunity/rooibos/pull/35)
- adds dist to repo to make life easier [`c5c364b`](https://github.com/rokucommunity/rooibos/commit/c5c364bc0d2ecd18d499509c8fb7bdbacd973a48)
- fix incorrect docs on stub method [`18581b8`](https://github.com/rokucommunity/rooibos/commit/18581b8f99f92893ccce4184d5d242e11f3f44e0)
- doc updates [`3b4e06e`](https://github.com/rokucommunity/rooibos/commit/3b4e06e8e8016f4fee5dd0e283ba8f4afd660f42)

#### [2.1.0](https://github.com/rokucommunity/rooibos/compare/2.0.0...2.1.0)

> 21 March 2019

- Feature/multi expect [`#34`](https://github.com/rokucommunity/rooibos/pull/34)
- Bugfix/documentation samples restructuring [`#32`](https://github.com/rokucommunity/rooibos/pull/32)
- Add multi overloads for expectOnce [`fac8adc`](https://github.com/rokucommunity/rooibos/commit/fac8adc6831e992751d58509baa0269181d0d9d4)
- Bounce to 2.1.0 [`ee85712`](https://github.com/rokucommunity/rooibos/commit/ee85712ba3b9534d1b1c12f35021fde1aa3cffac)
- updates travis ci and readme [`e849134`](https://github.com/rokucommunity/rooibos/commit/e849134ddc7b492a1ff7f011edfc1a064adc518c)

### [2.0.0](https://github.com/rokucommunity/rooibos/compare/0.4.3...2.0.0)

> 18 February 2019

#### [0.4.3](https://github.com/rokucommunity/rooibos/compare/0.4.1...0.4.3)

> 18 May 2021

- Beta [`#121`](https://github.com/rokucommunity/rooibos/pull/121)
- add workflow [`4b235e9`](https://github.com/rokucommunity/rooibos/commit/4b235e93175fb52763687c3c8f128672565b89d5)
- version bump [`a064344`](https://github.com/rokucommunity/rooibos/commit/a06434458cf3f25fd84d2c06af677addf1efcfae)
- Update build.yml [`8833bc5`](https://github.com/rokucommunity/rooibos/commit/8833bc54afffe9ddb737ec39d943c8321c0b911c)

#### [0.4.1](https://github.com/rokucommunity/rooibos/compare/v0.2...0.4.1)

> 9 February 2021

- feat(framework-tests): Improve framework tests by making it a bsc compiled app, so that it servers of an example of how to use rooibos with bsc [`#114`](https://github.com/rokucommunity/rooibos/pull/114)
- Chore/move to new bs compiler [`#106`](https://github.com/rokucommunity/rooibos/pull/106)
- Feature/option to remove test times [`#82`](https://github.com/rokucommunity/rooibos/pull/82)
- add option to not print test times [`#80`](https://github.com/rokucommunity/rooibos/pull/80)
- feat: Increase mocks limit to 25 - it is now possible to create up to 25 mocks for a given test suite. [`#73`](https://github.com/rokucommunity/rooibos/pull/73)
- fixes compatability issues with rooibos cli [`#68`](https://github.com/rokucommunity/rooibos/pull/68)
- Feature/check version [`#66`](https://github.com/rokucommunity/rooibos/pull/66)
- adds legacy support [`#61`](https://github.com/rokucommunity/rooibos/pull/61)
- Feature/move json config [`#54`](https://github.com/rokucommunity/rooibos/pull/54)
- Feature/code coverage [`#46`](https://github.com/rokucommunity/rooibos/pull/46)
- Feature/update to use latest rooibos c [`#41`](https://github.com/rokucommunity/rooibos/pull/41)
- Bugfix/overloaded expects collide on same method name on different objects [`#39`](https://github.com/rokucommunity/rooibos/pull/39)
- Bugfix/minor issues [`#35`](https://github.com/rokucommunity/rooibos/pull/35)
- Feature/multi expect [`#34`](https://github.com/rokucommunity/rooibos/pull/34)
- Bugfix/documentation samples restructuring [`#32`](https://github.com/rokucommunity/rooibos/pull/32)
- Rooibos 2.0.0 [`#26`](https://github.com/rokucommunity/rooibos/pull/26)
- fix #45 [`#45`](https://github.com/rokucommunity/rooibos/issues/45)
- doc update [`2a562ce`](https://github.com/rokucommunity/rooibos/commit/2a562cea0e965b54f492c5dff09d10554e88a745)
- removes rooibosPreprocessor - it now is in it's own repo [`1477b1e`](https://github.com/rokucommunity/rooibos/commit/1477b1e3ee9ae8ec3a9ec9de9167a51308b945b0)
- bunch of fixes for solo test and solo param filtering, introduces more stub test data to work with (mainly just looking at output right now - needs more asserts) and also better handling of params (deals with bright scripts loose json parser and invalid type, by having direct control of the suite, group and test via asText, as opposed to simply doing asJson and stringily) [`26e1f09`](https://github.com/rokucommunity/rooibos/commit/26e1f092b2c4c6050fe3d329af424597b643e35c)

### [v0.2](https://github.com/rokucommunity/rooibos/compare/v0.0.0-packages...v0.2)

> 1 October 2018

#### v0.0.0-packages

> 12 June 2024

- Updated to node 16.20.2 [`#285`](https://github.com/rokucommunity/rooibos/pull/285)
- Allow custom test reporter [`#265`](https://github.com/rokucommunity/rooibos/pull/265)
- Fixed logs sometimes getting cut off at the end of running tests [`#279`](https://github.com/rokucommunity/rooibos/pull/279)
- Fixed assertAsyncField params [`#278`](https://github.com/rokucommunity/rooibos/pull/278)
- Fixed async tests sometimes waiting the full timeout even though the … [`#276`](https://github.com/rokucommunity/rooibos/pull/276)
- Lcov fixes [`#274`](https://github.com/rokucommunity/rooibos/pull/274)
- Fix SGNode test generation [`#270`](https://github.com/rokucommunity/rooibos/pull/270)
- Fixed duplicate cur line injections [`#267`](https://github.com/rokucommunity/rooibos/pull/267)
- Code cov perf and bug fix in if statements [`#264`](https://github.com/rokucommunity/rooibos/pull/264)
- Added an api to fail tests with an exception [`#263`](https://github.com/rokucommunity/rooibos/pull/263)
- Reduce raw code statements [`#260`](https://github.com/rokucommunity/rooibos/pull/260)
- Updated annotations to be order agnostic [`#262`](https://github.com/rokucommunity/rooibos/pull/262)
- Feature/runtime global function mocking [`#259`](https://github.com/rokucommunity/rooibos/pull/259)
- Small formatter pass and code change to be formatter frendly [`#252`](https://github.com/rokucommunity/rooibos/pull/252)
- Updated default global excluded files [`#251`](https://github.com/rokucommunity/rooibos/pull/251)
- Fix Rooibos_init injection causing duplicate calls [`#247`](https://github.com/rokucommunity/rooibos/pull/247)
- Fix some sourcemap transpile issues [`#249`](https://github.com/rokucommunity/rooibos/pull/249)
- Added a config value to crash when a assert fails [`#248`](https://github.com/rokucommunity/rooibos/pull/248)
- Update FileFactory.ts to move status labels down for better visibility [`#245`](https://github.com/rokucommunity/rooibos/pull/245)
- fixes failing test [`#246`](https://github.com/rokucommunity/rooibos/pull/246)
- Junit test reporter [`#243`](https://github.com/rokucommunity/rooibos/pull/243)
- Chore/doc update [`#244`](https://github.com/rokucommunity/rooibos/pull/244)
- WIP: adds support for expecting on global functions and namespace functions [`#241`](https://github.com/rokucommunity/rooibos/pull/241)
- added docs about rendezvous tracking config flag [`#242`](https://github.com/rokucommunity/rooibos/pull/242)
- fix spelling [`#239`](https://github.com/rokucommunity/rooibos/pull/239)
- fixes docs issue [`#238`](https://github.com/rokucommunity/rooibos/pull/238)
- feat(core): add support for declaring tests as functions. Resolves #235 [`#236`](https://github.com/rokucommunity/rooibos/pull/236)
- Proposed fix for anonymous callback crash [`#234`](https://github.com/rokucommunity/rooibos/pull/234)
- fix: fixes crash when merging groups in a node test [`#233`](https://github.com/rokucommunity/rooibos/pull/233)
- Fix coverage files import [`#232`](https://github.com/rokucommunity/rooibos/pull/232)
- Adds release-it-stuff [`#231`](https://github.com/rokucommunity/rooibos/pull/231)
- docs: adds documentation for code coverage [`#230`](https://github.com/rokucommunity/rooibos/pull/230)
- Fix code coverage [`#209`](https://github.com/rokucommunity/rooibos/pull/209)
- fix(runner): addresses crash on tests-scene [`#229`](https://github.com/rokucommunity/rooibos/pull/229)
- Feat/custom test scene [`#225`](https://github.com/rokucommunity/rooibos/pull/225)
- Fix/compiler issues [`#224`](https://github.com/rokucommunity/rooibos/pull/224)
- Feat/async testing [`#223`](https://github.com/rokucommunity/rooibos/pull/223)
- [FLAG] Adds keepAppOpen flag [`#212`](https://github.com/rokucommunity/rooibos/pull/212)
- Fix build badge and fix readme formatting [`#218`](https://github.com/rokucommunity/rooibos/pull/218)
- Fix CI by NOT excluding package-lock [`#219`](https://github.com/rokucommunity/rooibos/pull/219)
- Fix/dont iteate m or top, dont loop too many times [`#216`](https://github.com/rokucommunity/rooibos/pull/216)
- Fix/crash stagingdir [`#215`](https://github.com/rokucommunity/rooibos/pull/215)
- Renames global timer var for uniqueness [`#211`](https://github.com/rokucommunity/rooibos/pull/211)
- Fix/add mc node support [`#208`](https://github.com/rokucommunity/rooibos/pull/208)
- fixes issue with creating main.brs file that would cause the entire project to go south [`#207`](https://github.com/rokucommunity/rooibos/pull/207)
- support otherFake with expectedInvocations&gt;1 [`#199`](https://github.com/rokucommunity/rooibos/pull/199)
- Fix windows builds [`#205`](https://github.com/rokucommunity/rooibos/pull/205)
- Fix - Remove "createNodefile" call duplicate [`#194`](https://github.com/rokucommunity/rooibos/pull/194)
- Fix/update to bsc 0.59.0 [`#192`](https://github.com/rokucommunity/rooibos/pull/192)
- Make "undent" a prod dependency [`#186`](https://github.com/rokucommunity/rooibos/pull/186)
- fix(asserts): fixes logic error in assertclass [`#179`](https://github.com/rokucommunity/rooibos/pull/179)
- Feat/allow pointers for assert class [`#178`](https://github.com/rokucommunity/rooibos/pull/178)
- fix(stubs): do not update non-mockable objects, needlessly [`#177`](https://github.com/rokucommunity/rooibos/pull/177)
- feature(stubs): rooibos will now automtically convert any object that requires stubbing into a stubbable object [`#176`](https://github.com/rokucommunity/rooibos/pull/176)
- fix(core): uses lifecycle hooks correctly, so as to not transpile files before enums and other bsc plugin tasks have occurred [`#175`](https://github.com/rokucommunity/rooibos/pull/175)
- Fix/fix incorrect empty message [`#173`](https://github.com/rokucommunity/rooibos/pull/173)
- fix(core): fixes incorrect class name equality checks [`#172`](https://github.com/rokucommunity/rooibos/pull/172)
- fix(asserts): improves like,and imrpoves output for types, across the board [`#171`](https://github.com/rokucommunity/rooibos/pull/171)
- Use AstEditor for all transpile modifications [`#159`](https://github.com/rokucommunity/rooibos/pull/159)
- Feat/update to bsc 0.49.0 [`#167`](https://github.com/rokucommunity/rooibos/pull/167)
- adds expectLastCallToThrowError so we can throw errors from fakes [`#166`](https://github.com/rokucommunity/rooibos/pull/166)
- Quality of life fixes [`#162`](https://github.com/rokucommunity/rooibos/pull/162)
- Feature/accept expect once with function param [`#157`](https://github.com/rokucommunity/rooibos/pull/157)
- adds callfunc once method [`#156`](https://github.com/rokucommunity/rooibos/pull/156)
- Update slack link [`#155`](https://github.com/rokucommunity/rooibos/pull/155)
- chore: update to bsc 0.45.3 [`#152`](https://github.com/rokucommunity/rooibos/pull/152)
- fix(node-tests): fixes node tests not running [`#147`](https://github.com/rokucommunity/rooibos/pull/147)
- fix: fixes equals failures [`#144`](https://github.com/rokucommunity/rooibos/pull/144)
- improves stringand float comparisons and assert not invalid message [`#142`](https://github.com/rokucommunity/rooibos/pull/142)
- Feat/add home press flag [`#140`](https://github.com/rokucommunity/rooibos/pull/140)
- Fix/doc improvements [`#139`](https://github.com/rokucommunity/rooibos/pull/139)
- Fix/doc improvements [`#138`](https://github.com/rokucommunity/rooibos/pull/138)
- Feat/adds flag to allow skipping some fields on iterative equals [`#135`](https://github.com/rokucommunity/rooibos/pull/135)
- Clutch of fixes [`#134`](https://github.com/rokucommunity/rooibos/pull/134)
- chore: fix docs [`#132`](https://github.com/rokucommunity/rooibos/pull/132)
- remove travis [`#130`](https://github.com/rokucommunity/rooibos/pull/130)
- chore: update docs [`#131`](https://github.com/rokucommunity/rooibos/pull/131)
- Beta [`#121`](https://github.com/rokucommunity/rooibos/pull/121)
- feat(framework-tests): Improve framework tests by making it a bsc compiled app, so that it servers of an example of how to use rooibos with bsc [`#114`](https://github.com/rokucommunity/rooibos/pull/114)
- Chore/move to new bs compiler [`#106`](https://github.com/rokucommunity/rooibos/pull/106)
- Feature/option to remove test times [`#82`](https://github.com/rokucommunity/rooibos/pull/82)
- add option to not print test times [`#80`](https://github.com/rokucommunity/rooibos/pull/80)
- feat: Increase mocks limit to 25 - it is now possible to create up to 25 mocks for a given test suite. [`#73`](https://github.com/rokucommunity/rooibos/pull/73)
- fixes compatability issues with rooibos cli [`#68`](https://github.com/rokucommunity/rooibos/pull/68)
- Feature/check version [`#66`](https://github.com/rokucommunity/rooibos/pull/66)
- adds legacy support [`#61`](https://github.com/rokucommunity/rooibos/pull/61)
- Feature/move json config [`#54`](https://github.com/rokucommunity/rooibos/pull/54)
- Feature/code coverage [`#46`](https://github.com/rokucommunity/rooibos/pull/46)
- Feature/update to use latest rooibos c [`#41`](https://github.com/rokucommunity/rooibos/pull/41)
- Bugfix/overloaded expects collide on same method name on different objects [`#39`](https://github.com/rokucommunity/rooibos/pull/39)
- Bugfix/minor issues [`#35`](https://github.com/rokucommunity/rooibos/pull/35)
- Feature/multi expect [`#34`](https://github.com/rokucommunity/rooibos/pull/34)
- Bugfix/documentation samples restructuring [`#32`](https://github.com/rokucommunity/rooibos/pull/32)
- Rooibos 2.0.0 [`#26`](https://github.com/rokucommunity/rooibos/pull/26)
- feat(core): add support for declaring tests as functions. Resolves #235 (#236) [`#235`](https://github.com/rokucommunity/rooibos/issues/235)
- fix #45 [`#45`](https://github.com/rokucommunity/rooibos/issues/45)
- fixes #5 checking for test naming collisions needs improvements with Params tests - can lead to vague error messages for params [`#5`](https://github.com/rokucommunity/rooibos/issues/5)
- fixes #13 aftereach not running [`#13`](https://github.com/rokucommunity/rooibos/issues/13)
- fixes #15 [`#15`](https://github.com/rokucommunity/rooibos/issues/15)
- fixes #8 Accept whitespace (carriage return) between annotations and test functions [`#8`](https://github.com/rokucommunity/rooibos/issues/8)
- - fixes #7 - all annotations are now case insensitive [`#7`](https://github.com/rokucommunity/rooibos/issues/7)
- fixes #9 Typo [`#9`](https://github.com/rokucommunity/rooibos/issues/9)
- -remove unused api docs folder [`6af014d`](https://github.com/rokucommunity/rooibos/commit/6af014d8d9352158739d36232e874ca26100b04d)
- Adjust implementation to fit with new proposal [`599e6ce`](https://github.com/rokucommunity/rooibos/commit/599e6ce0e02bd16f5ca6bc06ab16bb2a7ec8d1e2)
- Fixed failed tests and upgraded brighterscript [`ffdc3ca`](https://github.com/rokucommunity/rooibos/commit/ffdc3ca5662af46c6586ff3f072ba2ac05080325)
