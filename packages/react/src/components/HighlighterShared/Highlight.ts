/**
 * Code coming from code commit source with slight modifications
 * https://code.amazon.com/packages/AwsRocConsoleAssets/blobs/mainline/--/src/common/components/textEditor/highlight.ts
 */

/* Internal dependencies */
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-xml";

import aceBuilds from "ace-builds";

/**
 * Clean up CJK width styles added by Ace.
 * The width:NaNpx is just cruft (doesn't affect anything), since we don't rely on Ace's interactivity here.
 */
const cleanWidthStyles = (html: string) => html.replace(/ style='width:NaNpx'>/g, ">");

export const highlight = (code: string, mode: string) => {
  // Using Ace's module system `acequire()` to access its modules:
  const EditSession = aceBuilds.EditSession;
  const TextLayer = aceBuilds.require("ace/layer/text").Text;

  const session = new EditSession("");
  session.setUseWorker(false);
  session.setMode(`ace/mode/${mode}`);

  // Ace's TextLayer needs to attach to a parent element, which we don't need to attach to the DOM:
  const parent = document.createElement("div");
  const layer = new TextLayer(parent);
  layer.config = {}; // This empty config is necessary to support CJK; otherwise, highlighting will throw.

  layer.setSession(session);
  session.setValue(code);

  const length = session.getLength();
  const result: string[] = [];

  for (let i = 0; i < length; i += 1) {
    const lineContainer = document.createElement("div");
    layer.$renderLine(lineContainer, i, false);
    result.push(cleanWidthStyles(lineContainer.innerHTML));
  }

  return result;
};
