const assert = require("assert");
const {
  detectVersionFromContent
} = require("../src/version-detection");

describe("Version Detection", () => {
  describe("detectVersionFromContent", () => {
    it("should detect version from # comment", () => {
      const content = "# octopus version: 16.2\nvariable = value";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, "16.2");
    });

    it("should detect version from % comment", () => {
      const content = "% octopus version 14.1\nvariable = value";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, "14.1");
    });

    it("should detect version with different separators", () => {
      const content = "# octopus version-16.2\nvariable = value";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, "16.2");
    });

    it("should return null when no version comment found", () => {
      const content = "variable = value\nother = data";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, null);
    });

    it("should detect version-specific variables (16.2)", () => {
      const content = "SomeVariable16_2Only = value";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, "16.2");
    });

    it("should detect version-specific variables (14.1)", () => {
      const content = "SomeVariable14_1Only = value";
      const version = detectVersionFromContent(content);
      assert.strictEqual(version, "14.1");
    });
  });
});