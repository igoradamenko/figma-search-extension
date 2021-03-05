VERSION=$(node -e 'console.log(require("./package.json").version)')

zip $VERSION.zip CHANGELOG.md figma-bg.js figma-bridge.js icon.png LICENSE manifest.json popup.css popup.html popup.js README.md
