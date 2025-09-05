const assert = require("assert");
const { parseVariableAssignment } = require("../../src/utils/parser");

describe("Parser Utility Functions", () => {
  describe("parseVariableAssignment", () => {
    it("should parse simple variable assignment", () => {
      const result = parseVariableAssignment("variable = value");
      assert.deepStrictEqual(result, {
        variableName: "variable",
        value: "value",
        varStartPos: 0,
        varEndPos: 8,
        valueStartPos: 11,
        valueEndPos: 16,
      });
    });

    it("should parse variable assignment with spaces", () => {
      const result = parseVariableAssignment("  myVar  =  some value  ");
      assert.deepStrictEqual(result, {
        variableName: "myVar",
        value: "some value",
        varStartPos: 2,
        varEndPos: 7,
        valueStartPos: 12,
        valueEndPos: 22
      });
    });

    it("should parse variable assignment with comment", () => {
      const result = parseVariableAssignment("testVar = someValue # this is a comment");
      assert.deepStrictEqual(result, {
        variableName: "testVar",
        value: "someValue",
        varStartPos: 0,
        varEndPos: 7,
        valueStartPos: 10,
        valueEndPos: 19
      });
    });

    it("should parse variable assignment with value containing #", () => {
      const result = parseVariableAssignment("path = /path/to/file#name # comment");
      assert.deepStrictEqual(result, {
        variableName: 'path',
        value: '/path/to/file',
        varStartPos: 0,
        varEndPos: 4,
        valueStartPos: 7,
        valueEndPos: 20
      });
    });

    it("should return null for invalid assignment", () => {
      const result = parseVariableAssignment("invalid line");
      assert.strictEqual(result, null);
    });

    it("should return null for empty string", () => {
      const result = parseVariableAssignment("");
      assert.strictEqual(result, null);
    });

    it("should return null for variable starting with number", () => {
      const result = parseVariableAssignment("1invalid = value");
      assert.strictEqual(result, null);
    });
  });
});
