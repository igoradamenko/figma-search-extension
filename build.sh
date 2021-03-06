VERSION=$(node -e 'console.log(require("./package.json").version)')

zip -j $VERSION.zip CHANGELOG.md LICENSE README.md extension/*
