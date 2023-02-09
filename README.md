# UI for Porting Assistant for .NET Standalone Tool

Porting Assistant for .NET is an analysis tool that scans .NET Framework applications and generates a .NET Core compatibility assessment, helping customers port their applications to Linux faster.

Porting Assistant for .NET quickly scans .NET Framework applications to identify incompatibilities with .NET Core, finds known replacements, and generates detailed compatibility assessment reports. This reduces the manual effort involved in modernizing applications to Linux.

**PortingAssistant.UI** package provides the source code of Porting Assistant standalone tool's UI.

For more information about Porting Assistant and to try the tool, please refer to the documenation: https://aws.amazon.com/porting-assistant-dotnet/

## Introduction

Porting Assistant for .NET standalone tool is an electron application. The UI is a react application that is running on an Electron application.

## Repository Structure

We are using lerna to manage multiple packages in a single repository.

All code is located within the `./packages` folder.


* `./packages/csharp` - C# code that interfaces with Porting Assistant for .NET client
* `./packages/electron` - Electron related code. Including electron.js and electron build scripts.
* `./packages/react` - The React app that electron runs.
* `./packages/integration-test` - Integration tests.

## Developing Porting Assistant for .NET

### Prereq

We require the following:

* Node 14 (newer versions are not supported)
* .NET Core 3.1
* [.NET Runtime 6.0.12 ](https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-6.0.12-windows-x64-installer?cid=getdotnetcore)

### Getting started developing

#### Single commands

To start a local dev environment from scratch.


```
npm install && npm run build && npm start
```


#### Add a new dependency


1. Run `lerna add some-dependency --scope @porting-assistant/some-package`. For example `lerna add redux --scope @porting-assistant/react`.

You can also run `npm install` inside a package. But you will need to run `lerna bootstrap` afterwards.

#### Steps to package a dev exe.


1. Build the apps

```
npm run build
```



1. Package the apps, by default we package for Windows only.

```
npm run build:exe:dev
```



1. Find the exe in the ./dist/ folder.

### AWS UI

Porting Assistant for .NET standalone tool makes use of the newly released AWS UI design framework for UI components. AWS UI contains a collection of React components that help create intuitive, responsive, and accessible user experiences for web applications. It is available on NPM (Package manager of Node.JS). This work is available under the terms of the [Apache 2.0 open source license](http://#).

AWS UI’s source code and documentation has not been opensourced or released yet. For now the best way to obtain the list of available components and parameters for the components is to look into the package within node_modules. If you need additional help with AWS UI please file an issue, we will be happy to provide the help you need.


#### Steps to find list of components


1. Run npm 

```
npm install
```

1. Go into `packages/react/node_modules/@awsui/components-react/` to check the list of components.
2. The typescript typing files will also allow typescript intellisense / plugins to perform auto completion within IDEs.

# Additional Resources

[Porting Assistant for .NET](https://docs.aws.amazon.com/portingassistant/index.html)

[AWS Developer Center - Explore .NET on AWS](https://aws.amazon.com/developer/language/net/)
Find all the .NET code samples, step-by-step guides, videos, blog content, tools, and information about live events that you need in one place.

[AWS Developer Blog - .NET](https://aws.amazon.com/blogs/developer/category/programing-language/dot-net/)
Come see what .NET developers at AWS are up to! Learn about new .NET software announcements, guides, and how-to's.


# License

Libraries in this repository are licensed under the Apache 2.0 License.

See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for more information.
