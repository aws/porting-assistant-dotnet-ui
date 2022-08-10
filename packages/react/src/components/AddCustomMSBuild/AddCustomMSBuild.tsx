import { AttributeEditor, Box, Container, ExpandableSection, FormField, Header, Input, Select, SelectProps } from "@awsui/components-react";
import React, { useEffect, useState } from "react";

import { getAllMsbuildPath } from "../../utils/getAllMsbuildPath";
import { InfoLink } from "../InfoLink";
import styles from "./AddCustomMSBuild.module.scss";
interface Props {
  solution: any;
  setselectedMSbuild: any;
  setMSBuildArgumentsLst: any;
}

const AddCustomMsBuild: React.FC<Props> = ({ solution, setselectedMSbuild, setMSBuildArgumentsLst }) => {
  const [msbuildOptions, setmsbuildOptions] = useState<any>();
  const [selectedMSbuild, setselectedMSbuildLocal] = useState<any>();
  const [msBuildArguments, setmsBuildArguments] = useState<any[]>([]);
  let container = solution === null ? styles.container : styles.editContainer;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const MSBuildSettings = await getAllMsbuildPath();

    if (MSBuildSettings !== null) {
      const existingSolutionPaths = await window.electron.getState("solutions", {});

      if (solution !== null) {
        const msBuildPath = existingSolutionPaths[solution.solutionFilePath].msBuildPath;
        const args = existingSolutionPaths[solution.solutionFilePath].msBuildArguments;
        const defaultArguments: any[] = [];
        let defaultArgumentsCnt = 0;

        if (args !== undefined) {
          args.forEach((argu?: string) => {
            defaultArguments.push({ value: argu, valueHintText: "Default argument", controlId: defaultArgumentsCnt, rules: { required: "Please enter argument" } });
            defaultArgumentsCnt++;
          })
        }

        const msbuildOption = { label: msBuildPath };
        setMSBuildOptionsHelper(JSON.parse(MSBuildSettings));
        setselectedMSbuild(msbuildOption);
        setselectedMSbuildLocal(msbuildOption);
        setmsBuildArguments(defaultArguments);
        setMSBuildArgumentsLst(defaultArguments);
      }
      else {
        onMsbuildPathLocated(MSBuildSettings);
      }
    }
  }

  const setMSBuildOptionsHelper = (msBuildSettingsJSON: any) => {
    const allMsbuildOptions: SelectProps.Option[] = [];
    msBuildSettingsJSON.MsbuildExes.forEach((msExes?: any) => {
      const path = msExes.Path + '\\MSBuild\\Current\\Bin\\MSBuild.exe';
      allMsbuildOptions.push({ label: path });
    });

    const defaultMSbuildPath: SelectProps.Option = allMsbuildOptions[0];
    setmsbuildOptions(allMsbuildOptions);
    setselectedMSbuild(defaultMSbuildPath);
    setselectedMSbuildLocal(defaultMSbuildPath);
  }

  const onMsbuildPathLocated = (msBuildSettings: string) => {
    const msBuildSettingsJSON = JSON.parse(msBuildSettings);
    setMSBuildOptionsHelper(msBuildSettingsJSON);
    const defaultArguments: any[] = [];
    let defaultArgumentsCnt = 0;
    msBuildSettingsJSON.DefaultArguments.forEach((argu?: string) => {
      defaultArguments.push({ value: argu, valueHintText: "Default argument", controlId: defaultArgumentsCnt, rules: { required: "Please enter argument" } });
      defaultArgumentsCnt++;
    })

    setmsBuildArguments(defaultArguments);
    setMSBuildArgumentsLst(defaultArguments);
  };

  const onAddButtonClickHandler = (event: any) => {
    setmsBuildArguments(msBuildArguments => [...msBuildArguments, { value: "", valueHintText: "Enter custom argument", controlId: msBuildArguments.length }]);
    setMSBuildArgumentsLst((msBuildArguments: string | any[]) => [...msBuildArguments, { value: "", valueHintText: "Enter custom argument", controlId: msBuildArguments.length }]);
  };

  const onItemButtonClickHandler = (event: any) => {
    const deleteArgumentIndex = event.detail.itemIndex;
    let items: any;
    if (deleteArgumentIndex === msBuildArguments.length - 1) {
      items = msBuildArguments.slice();
      items.splice(deleteArgumentIndex, 1);
    } else {
      const updateitems = msBuildArguments.slice(deleteArgumentIndex + 1);
      items = msBuildArguments.slice(0, deleteArgumentIndex);
      updateitems.forEach((item: any) => {
        items.push({ value: item.value, valueHintText: item.valueHintText, readonly: item.readonly, controlId: item.controlId - 1 })
      });
    }

    setmsBuildArguments(items);
    setMSBuildArgumentsLst(items);
  };

  const handleMSArgsChange = (event: any, item: any) => {
    const inputArg = { value: event.detail.value, valueHintText: "Custom argument", controlId: item.controlId, rules: { required: "Please enter argument" } };
    const copyOfMSBuildArguments = msBuildArguments.slice(0);
    copyOfMSBuildArguments.splice(item.controlId, 1, inputArg);
    setmsBuildArguments(copyOfMSBuildArguments);
    setMSBuildArgumentsLst(copyOfMSBuildArguments);
  }

  const handleDisableAddMSArgs = () => {
    for (let i = 0; i < msBuildArguments.length; i++) {
      if (msBuildArguments[i].value.length === 0) {
        return true;
      }
    }
    return false;
  }

  const handleSelectedMSBuildPath = (event: any) => {
    setselectedMSbuild(event.detail.selectedOption);
    setselectedMSbuildLocal(event.detail.selectedOption);
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          info={
            <InfoLink
              heading="MSBuild Path"
              mainContent={
                <Box variant="p">
                  To build your application, Porting Assistant uses the latest version of MSBuild that is on the system as the default version. To override the default version, select a different version of MSBuild.
                </Box>
              }
              learnMoreLinks={[]}
            />
          }
        >
          MSBuild Path
        </Header>
      }
    >
      <ExpandableSection header="Configure Custom MSBuild Path" >
        <div className={container} >
          <FormField
            label="MSBuild path"
            description="The default MSBuild path is the latest version on the system. You can override the default version by selecting a different version."
          //errorText="Please provide a valid build script location."
          >
            <FormField>
              <Select
                options={msbuildOptions}
                selectedOption={selectedMSbuild}
                placeholder="Choose MSbuild"
                onChange={handleSelectedMSBuildPath}
                data-testid="selectMSbuild"
              ></Select>
            </FormField>
          </FormField>

          <FormField
            label={<span> Customize your build <i> - optional </i> </span>}
            description="Do not enter plaintext credentials or other sensitive data in MSBuild arguments."
          >
            <div>
              <AttributeEditor
                empty="No MSBuild argument"
                addButtonText="Add argument"
                removeButtonText="Remove"
                isItemRemovable={() => true}
                definition={[
                  {
                    label: "",
                    control: (item: any) => (
                      <Input
                        value={item.value}
                        placeholder="Enter custom argument"
                        //readonly={item.readonly}
                        onChange={(event) => { handleMSArgsChange(event, item) }}
                      />
                    ),
                  },
                ]}
                items={msBuildArguments}
                onAddButtonClick={onAddButtonClickHandler}
                onRemoveButtonClick={onItemButtonClickHandler}
                disableAddButton={handleDisableAddMSArgs()}
              ></AttributeEditor>
            </div>
          </FormField>
        </div>
      </ExpandableSection>
    </Container>
  );
};


export const AddCustomMsBuildForm = React.memo(AddCustomMsBuild);
