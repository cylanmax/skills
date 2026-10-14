import { describe, expect, it } from "vitest";

import {
  isFormattedInputValue,
  shouldDeferFormattedInputChange,
  transformFormattedInputValue,
} from "./formatted-input";

describe("FormattedInput", () => {
  it("transforms accepted values to lowercase, uppercase, or titlecase", () => {
    expect(transformFormattedInputValue("Fishing-Cap", "lowercase")).toBe(
      "fishing-cap",
    );
    expect(transformFormattedInputValue("fishing-cap", "uppercase")).toBe(
      "FISHING-CAP",
    );
    expect(transformFormattedInputValue("fISHING cAP", "titlecase")).toBe(
      "Fishing Cap",
    );
  });

  it("filters non-negative prices and limits decimal places", () => {
    const options = { format: "positive-decimal" as const, maxDecimalPlaces: 2 };

    expect(isFormattedInputValue("12.34", options)).toBe(true);
    expect(isFormattedInputValue("12.345", options)).toBe(false);
    expect(isFormattedInputValue("-12.34", options)).toBe(false);
    expect(isFormattedInputValue("12e3", options)).toBe(false);
  });

  it("requires a leading minus sign for negative formats", () => {
    expect(isFormattedInputValue("-10.5", { format: "negative-decimal" })).toBe(true);
    expect(isFormattedInputValue("10.5", { format: "negative-decimal" })).toBe(false);
  });

  it("resets global RegExp state for repeated validation", () => {
    const options = { customRegExp: /^[A-Z0-9]*$/g };
    expect(isFormattedInputValue("AB12", options)).toBe(true);
    expect(isFormattedInputValue("AB12", options)).toBe(true);
  });

  it("defers IME text until composition finishes", () => {
    expect(shouldDeferFormattedInputChange(true, true)).toBe(true);
    expect(shouldDeferFormattedInputChange(true, false)).toBe(false);
    expect(shouldDeferFormattedInputChange(false, false)).toBe(false);
  });
});
