set -xe

echo 'Executing custom build script'

current_package_name=$(brazil-path pkg.name)
package_build_dir=$(brazil-path package-build-root)



# copy assets to app folder
# rsync -avz --exclude 'app' --exclude 'brazil*' --exclude 'private' $package_build_dir/. $package_build_dir/app

echo 'Contents of Build folder'
ls -lhtr $package_build_dir


rm -Rf dist && mkdir -p dist

cp -R $package_build_dir/. dist/

cd dist && rm -Rf brazil* && rm -Rf private

cd ../ && mkdir -p $package_build_dir/app && cp -R dist/. $package_build_dir/app/

