powershell -command "if(!(Test-Path C:\\testsolutions)) { Expand-Archive -Force 'C:\\test-solutions.zip' 'C:\\' }"
mkdir ..\electron\test_store