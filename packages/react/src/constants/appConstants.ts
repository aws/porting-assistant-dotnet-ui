const profileSelection = {
  PROFILE_SELECTION: {
    heading: "AWS profile",
    mainContent: "Select an AWS profile to allow Porting Assistant for .NET to assess your solution for .NET Core compatibility. You can also add an AWS named profile using the AWS CLI.",
    description: {
      custom: "Select a named profile defined in the shared AWS config and credentials files." + 
      "If you change these files directly or in the AWS CLI, you will need to restart Porting Assisstant for .NET for the changes to be reflected on this page.",
      default: "Use credentials that you set up to make programmatic requests for AWS resources using the AWS CLI or AWS API (SDKs). The AWS SDK for .NET searches for the credentials and automatically selects the first available set. "
    },
    url: {
      custom: "https://docs.aws.amazon.com/sdkref/latest/guide/file-location.html",
      default: "https://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/creds-assign.html"
    },
    defaultNotFound: "No credentials found. "
  },
  USAGE_DATA: {
    heading: "Porting Assisstant for .NET usage data sharing",
    mainContent: "When you share your usage data, Porting Assistant for .NET will collect information only about the public NuGet packages, APIs, and stack traces." + 
    "This information is used to make the Porting Assistant for .NET product better, for example, to improve the package and API replacement recommendations." + 
    "Porting Assistant for .NET does not collect any identifying information about you.",
    checkbox: "I agree to share my usage data with Porting Assistant for .NET"
  }
}
export {profileSelection};