// import {act} from '@testing-library/react';
// import {mount, ReactWrapper} from 'enzyme';
import React from "react";
import {Provider} from "react-redux";
import { Router } from "react-router-dom";
import { createStore } from "redux";
import configureStore from "redux-mock-store";

import { Backend, Electron, Porting } from "../bootstrapElectron";
import { ProfileSelection } from "../components/Setup/ProfileSelection";
import { createRootReducer } from '../store/reducers';
import history from "../utils/history";


declare global {
  namespace NodeJS {
    interface Global {
      document: Document;
      window: {
        electron: Electron;
        backend: Backend;
        porting: Porting;
        reduxStore: any;
      };
      navigator: Navigator;
    }
  }
}


describe('ProfileSelection', () => {
  const state = {
        setupForm: {
          awsRegion: "",
          useDefaultCredentials: false,
          profileId: "",
          workingDirectory: "",
          isSharingData: true,
          msbuildPath: "",
          enableAbstractVisualization: false,
          enablePortingAssistantIntegration: false,
          enableSharedObject: false,
          enableDeployment: false,
      },
      settings: {
          awsRegion: "",
          useDefaultCredentials: false,
          profileId: "",
          workingDirectory: "",
          isSharingData: true,
          msbuildPath: "",
          enableAbstractVisualization: false,
          enablePortingAssistantIntegration: false,
          enableSharedObject: false,
          enableDeployment: false,
      },
      validProfileSetting: {
          isValidProfileForMetric: false,
          isValidProfileForServiceEndpoint: false,
          serviceEndpointErrorForValidProfile: false,
          serviceEndpointDetailedErrorForValidProfile: false,
          getConfigFinished: true,
      },
      profiles: [],

  };
  const defaultProfileState = {
      setupForm: {
          awsRegion: "",
          useDefaultCredentials: false,
          profileId: "",
          workingDirectory: "",
          isSharingData: true,
          msbuildPath: "",
          enableAbstractVisualization: false,
          enablePortingAssistantIntegration: false,
          enableSharedObject: false,
          enableDeployment: false,
      },
      settings: {
          awsRegion: "",
          useDefaultCredentials: false,
          profileId: "1",
          workingDirectory: "testDirectory",
          isSharingData: true,
          msbuildPath: "testPath",
          enableAbstractVisualization: false,
          enablePortingAssistantIntegration: false,
          enableSharedObject: false,
          enableDeployment: false,
      },
      validProfileSetting: {
          isValidProfileForMetric: false,
          isValidProfileForServiceEndpoint: false,
          serviceEndpointErrorForValidProfile: false,
          serviceEndpointDetailedErrorForValidProfile: false,
          getConfigFinished: true,
      },
      profiles: []
  };
  const preventDefault = jest.fn()
  const nextFn = jest.fn()
  const mockStore = configureStore()

  afterEach(()=> {
      jest.clearAllMocks();
    })

  test("field validation", ()=> {
      // const store = createStore(createRootReducer(), {});
      const store = mockStore(state);
      let wrapper = mount(
          <Provider store={store}>
            <Router history={history}>
              <ProfileSelection title={"test title"} buttonText="Update" next={nextFn}/>
            </Router>
          </Provider>
      );
      act(()=> {
          // @ts-ignore
          wrapper.find("#next-btn").first().prop("onClick")()
      })
      wrapper.update()
      expect(wrapper.find("FormField").at(1).text().indexOf("AWS named profile is required.")).not.toBe(-1)
  });

  // test("update settings", ()=> {
  //     const onWorkingDirectoryLocated = jest.spyOn(window.profile, 'onWorkingDirectoryLocated')
  //     const onMsbuildPathLocated = jest.spyOn(window.paths, 'onMsbuildPathLocated')
  //     const validateProfile = jest.spyOn(window.profile, 'validateProfile')
  //     const onProfileValidated = jest.spyOn(window.profile, 'onProfileValidated')
  //     const onGetConfigFinished = jest.spyOn(window.service, 'onGetConfigFinished')
  //     const getConfig = jest.spyOn(window.service, 'getConfig')
  //     const getSettingsFromFile = jest.spyOn(window.settings, 'getSettingsFromFile')
  //     // const onConfigRetrievedFromFile = jest.spyOn(window.backend, 'onConfigRetrievedFromFile')
  //     // const putSettings = jest.spyOn(window.settings, 'putSettings')
  //     const store = configureStore()(() => state);
  //     let wrapper = mount(
  //         <Provider store={store}>
  //             <Router history={history}>
  //                 <ProfileSelection title={"test title"} buttonText="Update" next={nextFn}/>
  //             </Router>
  //         </Provider>
  //     );

  //     // update profile selection
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Select").at(1).prop("onChange")({detail: {selectedOption: {id: "1"}}})
  //         //wrapper.find("Checkbox").simulate('change', {target: {checked: true}});
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Select").at(1).prop("selectedId")).toBe("1")

  //     // update working directory
  //     act(()=> {
  //         onWorkingDirectoryLocated.mock.calls[0][0](`{"workingDirectory": "testDirectory", "locationProvided": true}`)
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Tooltip").at(0).text().indexOf('testDirectory')).not.toBe(-1)

  //     // update MSBuild path
  //     act(()=> {
  //         onMsbuildPathLocated.mock.calls[0][0](`{"msbuildPath": "testPath", "locationProvided": true}`)
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Tooltip").at(1).text().indexOf('testPath')).not.toBe(-1)

  //     // submit changes
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("#next-btn").first().prop("onClick")()
  //     })
  //     wrapper.update()
  //     expect(getConfig).toHaveBeenCalled()
  //     expect(onGetConfigFinished).toHaveBeenCalled()


  // });

  // test("default profile selected", ()=> {
  //     const store = configureStore()(() => defaultProfileState);
  //     let wrapper = mount(
  //         <Provider store={store}>
  //             <Router history={history}>
  //                 <ProfileSelection title={"test title"} buttonText="Update" next={nextFn}/>
  //             </Router>
  //         </Provider>
  //     );
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Select").at(1).prop("onChange")({detail: {selectedOption: {id: "1"}}})
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Select").at(1).prop("selectedId")).toBe("1")
  //     expect(wrapper.find("Tooltip").at(0).text().indexOf('testDirectory')).not.toBe(-1)
  //     expect(wrapper.find("Tooltip").at(1).text().indexOf('testPath')).not.toBe(-1)
  // });

  // test("sharing data changes", ()=> {
  //     const store = configureStore()(() => state);
  //     let wrapper = mount(
  //         <Provider store={store}>
  //             <Router history={history}>
  //                 <ProfileSelection title={"test title"} buttonText="Update" next={nextFn}/>
  //             </Router>
  //         </Provider>
  //     );
  //     expect(wrapper.find("Checkbox").at(0).prop("checked")).toBe(true)
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Checkbox").at(0).prop("onChange")({detail: {checked: false}})
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Checkbox").at(0).prop("checked")).toBe(false)
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Checkbox").at(0).prop("onChange")({detail: {checked: true}})
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Checkbox").at(0).prop("checked")).toBe(true)
  // });

  // test("action buttons", ()=> {
  //     const store = configureStore()(() => state);
  //     let wrapper = mount(
  //         <Provider store={store}>
  //             <Router history={history}>
  //                 <ProfileSelection title={"test title"} buttonText="Update" next={nextFn}/>
  //             </Router>
  //         </Provider>
  //     );
  //     //show ProfileSelectionModal
  //     expect(wrapper.find("Memo(ProfileSelectionModalInternal)").prop("showModal")).toBe(false)
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Memo(ProfileSelectionModalInternal)").prop("onSetModalVisibility")(true)
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Memo(ProfileSelectionModalInternal)").prop("showModal")).toBe(true)

  //     //add profile
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Memo(ProfileSelectionModalInternal)").prop("onAddProfile")("testProfileName")
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("#profile-selection").find("Select").prop("options")).toEqual([{
  //         label: "testProfileName",
  //         id: "testProfileName",
  //     }])

  //     //upload msbuildpath
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find({"description": "Set the path for MSBuild to be used for building the application."}).find("Button").prop("onClick")({preventDefault})
  //     })
  //     wrapper.update()
  //     expect(window.paths.getMsbuildPath).toHaveBeenCalled()

  //     //update working directory
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find({"description": "Add the directory you want to use to store output from the analysis and extraction of your application. If you change the working directory, you must reanalyze your application."}).find("Button").prop("onClick")({preventDefault})
  //     })
  //     wrapper.update()
  //     expect(window.profile.getWorkingDirectory).toHaveBeenCalled()

  //     //add named profile
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("#add-named-profile").prop("onClick")({preventDefault})
  //     })
  //     wrapper.update()
  //     expect(wrapper.find("Memo(ProfileSelectionModalInternal)").prop("showModal")).toBe(true)

  //     //link button
  //     act(()=> {
  //         // @ts-ignore
  //         wrapper.find("Form").find({"variant": "link"}).prop("onClick")({preventDefault})
  //     })
  //     wrapper.update()
  // });

});