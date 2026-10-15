const assert = require("assert");
const { getCurrentVersion, getVariables } = require("../../src/utils/versionManager");

describe("Version Manager", () => {
  describe("getCurrentVersion", () => {
    it("should return current version", () => {
      const version = getCurrentVersion();
      assert.strictEqual(typeof version, "string");
      assert.match(version, /^\d+\.\d+$/);
    });
  });

  describe("getVariables", () => {
    it("should return variables object", () => {
      const variables = getVariables();
      assert.strictEqual(typeof variables, "object");
      assert.strictEqual(Array.isArray(variables), false);
    });
  });
});
