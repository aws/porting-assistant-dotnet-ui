import { Box } from "@cloudscape-design/components";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";

import { ImportSolution } from "../components/AddSolution/AddSolutionForm";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { externalUrls } from "../constants/externalUrls";
import { setInfo } from "../store/actions/tools";

const AddSolutionInternal: React.FC<{}> = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "",
        mainContent: (
          <Box variant="p">
            Porting Assistant for .NET analyzes source code for supported APIs and packages (Microsoft Core APIs and
            packages, and public and private NuGet packages). It identifies incompatible API calls made from each
            package and checks whether a package is compatible with .NET Core. Porting Assistant for .NET parses package
            reference files for each project in the .NET Framework solution and iterates through each referenced public
            and private NuGet package, as well as each Microsoft Core API and package, to check whether the latest
            version of the package that is compatible with .NET Core is available.
          </Box>
        ),
        learnMoreLinks: [
          {
            text: "How Porting Assistant for .NET works",
            externalUrl: externalUrls.howItWorks
          }
        ]
      })
    );
  }, [dispatch, location]);

  return (
    <PortingAssistantAppLayout
      contentType="form"
      content={<ImportSolution />}
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumb} />}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" },
  { text: "Assess a new solution", href: "/add-solution" }
];

export const AddSolution = React.memo(AddSolutionInternal);
