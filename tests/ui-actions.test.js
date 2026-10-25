"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../app/www/js/app.js"),
  "utf8",
);

function updateAvailability(state) {
  const start = source.indexOf("    function updateActionAvailability() {");
  const end = source.indexOf("    function setFileViewMode(", start);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({
    state,
    uiPreview: {},
    passwordManagerApi: { updatePasswordManagerStatus() {} },
  });
  vm.runInContext(
    `${source.slice(start, end)}\nupdateActionAvailability();`,
    context,
  );
}

function createElements() {
  return new Proxy({}, {
    get(target, key) {
      target[key] ||= {
        disabled: false,
        checked: false,
        parentElement: { setAttribute() {} },
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {},
      };
      return target[key];
    },
  });
}

test("archive-independent options remain available without an archive", () => {
  const elements = createElements();
  const state = {
    elements,
    entries: [],
    allFilePaths: [],
    selectedPaths: new Set(),
    previewReady: false,
    previewLimited: false,
    previewSolid: false,
    fileViewMode: "list",
    previewing: false,
    running: false,
    info: null,
    selectedDirectory: "",
    passwordRequired: false,
    passwordVerified: true,
    passwordVerificationTimedOut: false,
  };

  updateAvailability(state);
  assert.equal(elements.openPasswordManagerBtn.disabled, false);
  assert.equal(elements.deleteSourceInput.disabled, false);
  assert.equal(elements.extractBtn.disabled, true);
  assert.equal(elements.testBtn.disabled, true);

  state.running = true;
  updateAvailability(state);
  assert.equal(elements.openPasswordManagerBtn.disabled, true);
  assert.equal(elements.deleteSourceInput.disabled, true);
});

test("pathless startup refreshes action availability before returning", () => {
  assert.match(
    source,
    /if \(!state\.filePath\) \{[\s\S]*?updateActionAvailability\(\);\s*return;/,
  );
});
