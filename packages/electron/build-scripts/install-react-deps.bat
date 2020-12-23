rmdir /s/q react_build
mkdir react_build
xcopy node_modules\@porting-assistant\react\build\* react_build /s /e /y
