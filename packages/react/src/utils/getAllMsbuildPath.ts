export const getAllMsbuildPath = async () => {
  try {  
    var mSBuildSettings = await window.backend.getAllMsbuildPath();  
    return mSBuildSettings;
  }
  catch(ex) {
    return null;
  }
};
