# Contributing to the Porting Assistant for .NET UI

We greatly value feedback and contributions from our community. Whether it's a bug report, new feature, correction, or additional documentation, we welcome your issues and pull requests. Please read through this document before submitting any issues or pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.

## Table of Contents

* [Report Bugs/Issues](#report-bugs)
* [Submit Pull Requests (PRs)](#submit-pull-requests)
* [Code of Conduct](#code-of-conduct)
* [License](#license)


## Report Bugs

You can file bug reports against the Porting Assistant on the [GitHub issues][issues] page.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment


## Submit Pull Requests

We are always happy to receive code and documentation contributions to the Porting Assistant. Please be aware of the following notes prior to opening a pull request:

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *main* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.
4. You have tested your change and added tests where appropriate. Wherever possible, pull requests should contain tests as appropriate. Bugfixes should contain tests that exercise the corrected behavior (i.e., the test should fail without the bugfix and pass with it), and new features should be accompanied by tests exercising the feature.

GitHub provides additional documentation on [Creating a Pull Request](https://help.github.com/articles/creating-a-pull-request/).

Please remember to:
* Use commit messages (and PR titles) that follow the guidelines under [Commit Your Change](#commit-your-change).
* Send us a pull request, answering any default questions in the pull request interface.
* Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

## Commit Your Change

We use commit messages to update the project version number and generate changelog entries, so it's important for them to follow the right format. Valid commit messages adhere to the [conventional commit][conventional-commit] standard and include a prefix, separated from the rest of the message by a colon and a space. Here are a few examples:

```
feature: add new field for recommendation source
fix: fix UI spacing issue on assessment page
documentation: update contributing documentation
```

Example supported prefixes are listed in the table below.

| Prefix          | Use for...                                                                                     |
|----------------:|:-----------------------------------------------------------------------------------------------|
| `feature`       | Adding a new feature.                                                                          |
| `fix`           | Bug fixes.                                                                                     |
| `refactor`      | A code refactor.                                                                                   |
| `change`        | Any other code change.                                                                         |
| `documentation` | Documentation changes.                                                                         |
| `test`          | Test changes.                                                                         |

Some of the prefixes allow abbreviation ; e.g. `feat` and `docs` are both valid. If you omit a prefix, the commit will be treated as a `change`.

For the rest of the message, use imperative style and keep things concise but informative. See [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/) for guidance.

## Finding contributions to work on
Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct][code-of-conduct]. For more information see the [Code of Conduct FAQ][code-of-conduct-faq] or contact opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.

## Licensing

See the [LICENSE](./LICENSE) and [NOTICE](./NOTICE) files for our project's licensing. We will ask you to confirm the licensing of your contribution.

[issues]: https://github.com/aws/porting-assistant-dotnet-ui/issues
[pr]: https://github.com/aws/porting-assistant-dotnet-ui/pulls
[license]: http://aws.amazon.com/apache2.0/
[homebrew]: http://brew.sh/
[cla]: http://en.wikipedia.org/wiki/Contributor_License_Agreement
[code-of-conduct]: https://aws.github.io/code-of-conduct
[code-of-conduct-faq]: https://aws.github.io/code-of-conduct-faq
[conventional-commit]: https://conventionalcommits.org/