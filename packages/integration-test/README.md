# `@porting-assistant/integration-test`

## description

the integration test suite is built on the spectron framework. the test is making sure all ui features from porting assistant electron app are functionaly working.

the test is able to run on the windows platform only.

## testing apps:

put test solutions in C:\\testsolutions

mvcmusicstore

https://github.com/SebastiaanLubbers/MvcMusicStore

NopCommerce 3.1.0

https://github.com/nopSolutions/nopCommerce/releases/tag/release-3.10

miniblog

https://github.com/madskristensen/Miniblog.Core

## Usage

1. install app (default location is C:\\TestApp)

```
Start-Process -FilePath "C:/Porting-Assistant-Dotnet.exe" -ArgumentList "/S /D=C:\\TestApp" -Wait -PassThru -Verb RunAs;
cd packages\\integration-test;
```

2. compile integration test code

```
npm install --only=production --production;
```

run test:

```
npm run test --unhandled-rejections=strict -- --detectOpenHandles
```

docs:
https://www.electronjs.org/spectron

https://webdriver.io/docs/api.html
