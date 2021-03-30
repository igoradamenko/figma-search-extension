VERSION=$(node -e 'console.log(require("./package.json").version)')

rm -rf tmp $VERSION.zip
mkdir tmp

cp -r CHANGELOG.md LICENSE README.md extension/* tmp

cd tmp && zip ../$VERSION.zip ./* ./**/* && cd ..

rm -rf tmp
