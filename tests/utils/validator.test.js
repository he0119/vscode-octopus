const assert = require("assert");
const {
  containsMathematicalExpression
} = require("../../src/utils/validator");

describe("Validator Regex Patterns", () => {
  describe("containsMathematicalExpression", () => {
    it("should detect mathematical operators", () => {
      assert.strictEqual(containsMathematicalExpression("1 + 2"), true);
      assert.strictEqual(containsMathematicalExpression("3 * 4"), true);
      assert.strictEqual(containsMathematicalExpression("5 - 6"), true);
      assert.strictEqual(containsMathematicalExpression("7 / 8"), true);
      assert.strictEqual(containsMathematicalExpression("2^3"), true);
      assert.strictEqual(containsMathematicalExpression("simple_value"), false);
    });

    it("should detect predefined constants", () => {
      assert.strictEqual(containsMathematicalExpression("pi"), true);
      assert.strictEqual(containsMathematicalExpression("2 * pi"), true);
      assert.strictEqual(containsMathematicalExpression("e"), true);
      assert.strictEqual(containsMathematicalExpression("angstrom"), true);
      assert.strictEqual(containsMathematicalExpression("nanometer"), true);
      assert.strictEqual(containsMathematicalExpression("unknown_constant"), false);
    });

    it("should detect mathematical functions", () => {
      assert.strictEqual(containsMathematicalExpression("sqrt(4)"), true);
      assert.strictEqual(containsMathematicalExpression("sin(pi)"), true);
      assert.strictEqual(containsMathematicalExpression("exp(2)"), true);
      assert.strictEqual(containsMathematicalExpression("log(10)"), true);
      assert.strictEqual(containsMathematicalExpression("unknown_func(5)"), false);
    });

    it("should detect complex number notation", () => {
      assert.strictEqual(containsMathematicalExpression("{1, 2}"), true);
      assert.strictEqual(containsMathematicalExpression("{0.5, -0.5}"), true);
      assert.strictEqual(containsMathematicalExpression("{real, imag}"), true);
      assert.strictEqual(containsMathematicalExpression("{1}"), false);
      assert.strictEqual(containsMathematicalExpression("{1, 2, 3}"), false);
    });

    it("should handle case insensitive constants", () => {
      assert.strictEqual(containsMathematicalExpression("PI"), true);
      assert.strictEqual(containsMathematicalExpression("E"), true);
      assert.strictEqual(containsMathematicalExpression("SIN(pi)"), true);
      assert.strictEqual(containsMathematicalExpression("Sqrt(4)"), true);
    });

    it("should detect complex mathematical expressions", () => {
      assert.strictEqual(containsMathematicalExpression("2 * pi + sin(45)"), true);
      assert.strictEqual(containsMathematicalExpression("sqrt(3^2 + 4^2)"), true);
      assert.strictEqual(containsMathematicalExpression("exp(-i * pi)"), true);
      assert.strictEqual(containsMathematicalExpression("{1, 2} * cos(30)"), true);
    });
  });
});
