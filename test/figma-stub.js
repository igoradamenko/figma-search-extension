/* open-load all pages and then copy-paste into figma */
// function genStubAndCopy() {
//   const result = {};
//
//   traverseAndStore(figma.root, result, null);
//
//   copy(JSON.stringify(result));
//
//   console.log('Done');
//
//   function traverseAndStore(figmaNode, resultNode) {
//     resultNode.id = figmaNode.id;
//     resultNode.name = figmaNode.name;
//     resultNode.type = figmaNode.type;
//
//     if (figmaNode.children) {
//       resultNode.children = [];
//
//       figmaNode.children.forEach(figmaChild => {
//         const resultChild = {};
//         resultNode.children.push(resultChild);
//
//         traverseAndStore(figmaChild, resultChild);
//       });
//     }
//   }
// }

figmaFillParents(window.figmaGeneratedStubs, null);
figmaFillPagesSelection(window.figmaGeneratedStubs);
figmaFillCurrentPage(window.figmaGeneratedStubs)

window.figmaRootStubs = figmaGenerateNotFullyLoadedPagesStubs(window.figmaGeneratedStubs);
window.figmaFullyLoadedRootStubs = window.figmaGeneratedStubs;

function figmaGenerateNotFullyLoadedPagesStubs(figmaRoot) {
  const result = {...figmaRoot};
  result.children = [...figmaRoot.children];

  // skip first page to leave it “loaded”
  for (let i = 1; i < result.children.length; i++) {
    result.children[i] = {...result.children[i], children: [] };
  }

  return result;
}

function figmaFillParents(figmaNode, parentNode) {
  figmaNode.parent = parentNode;

  if (figmaNode.children) {
    figmaNode.children.forEach(child => figmaFillParents(child, figmaNode));
  }
}

function figmaFillPagesSelection(figmaNode) {
  figmaNode.children.forEach(page => page.selection = []);
}

function figmaFillCurrentPage(figmaNode) {
  figmaNode.currentPage = figmaNode.children[0];
}
