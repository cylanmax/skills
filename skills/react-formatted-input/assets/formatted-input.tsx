"use client";

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CompositionEvent,
} from "react";

export type InputFormat =
  | "text"
  | "email"
  | "password"
  | "number"
  | "integer"
  | "decimal"
  | "positive-integer"
  | "negative-integer"
  | "positive-decimal"
  | "negative-decimal"
  | "positive-number"
  | "negative-number";

export type InputTransform = "none" | "lowercase" | "uppercase" | "titlecase";

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "inputMode" | "type"
>;

export interface FormattedInputProps extends NativeInputProps {
  format?: InputFormat;
  transform?: InputTransform;
  customRegExp?: RegExp;
  maxDecimalPlaces?: number;
  onValueChange?: (value: string) => void;
}

type NumericFormat = Exclude<InputFormat, "text" | "email" | "password">;

const numericFormats: Record<
  NumericFormat,
  { allowDecimal: boolean; allowNegative: boolean; requiresNegative: boolean }
> = {
  decimal: { allowDecimal: true, allowNegative: true, requiresNegative: false },
  integer: { allowDecimal: false, allowNegative: true, requiresNegative: false },
  "negative-decimal": { allowDecimal: true, allowNegative: true, requiresNegative: true },
  "negative-integer": { allowDecimal: false, allowNegative: true, requiresNegative: true },
  "negative-number": { allowDecimal: true, allowNegative: true, requiresNegative: true },
  number: { allowDecimal: true, allowNegative: true, requiresNegative: false },
  "positive-decimal": { allowDecimal: true, allowNegative: false, requiresNegative: false },
  "positive-integer": { allowDecimal: false, allowNegative: false, requiresNegative: false },
  "positive-number": { allowDecimal: true, allowNegative: false, requiresNegative: false },
};

export interface InputValidationOptions {
  customRegExp?: RegExp;
  format?: InputFormat;
  maxDecimalPlaces?: number;
}

export function isFormattedInputValue(
  value: string,
  { customRegExp, format = "text", maxDecimalPlaces }: InputValidationOptions = {},
) {
  if (value !== "" && !matchesFormat(value, format, maxDecimalPlaces)) return false;
  return value === "" || !customRegExp || testRegExp(customRegExp, value);
}

export function transformFormattedInputValue(
  value: string,
  transform: InputTransform = "none",
) {
  if (transform === "lowercase") return value.toLowerCase();
  if (transform === "uppercase") return value.toUpperCase();
  if (transform === "titlecase") {
    return value.toLowerCase().replace(/\b[a-z]/g, (character) =>
      character.toUpperCase(),
    );
  }

  return value;
}

export function shouldDeferFormattedInputChange(
  isComposing: boolean,
  nativeIsComposing: boolean | undefined,
) {
  return nativeIsComposing === true || (isComposing && nativeIsComposing !== false);
}

function matchesFormat(
  value: string,
  format: InputFormat,
  maxDecimalPlaces: number | undefined,
) {
  if (format === "text" || format === "password") return true;
  if (format === "email") return /^[^\s@]*@?[^\s@]*$/.test(value);

  const numericFormat = numericFormats[format];
  const sign = numericFormat.allowNegative ? "-?" : "";
  const requiredSign = numericFormat.requiresNegative ? "-" : sign;
  const decimal = numericFormat.allowDecimal ? "(?:\\.\\d*)?" : "";

  if (!new RegExp(`^${requiredSign}\\d*${decimal}$`).test(value)) return false;
  if (!numericFormat.allowDecimal || maxDecimalPlaces === undefined) return true;

  const normalizedMaximum = Math.max(0, Math.floor(maxDecimalPlaces));
  const decimalIndex = value.indexOf(".");
  if (decimalIndex === -1) return true;
  if (normalizedMaximum === 0) return false;
  return value.length - decimalIndex - 1 <= normalizedMaximum;
}

function testRegExp(expression: RegExp, value: string) {
  expression.lastIndex = 0;
  const matches = expression.test(value);
  expression.lastIndex = 0;
  return matches;
}

function inputPresentation(format: InputFormat) {
  if (format === "email") return { inputMode: undefined, type: "email" as const };
  if (format === "password") return { inputMode: undefined, type: "password" as const };
  if (format in numericFormats) {
    return {
      inputMode: numericFormats[format as NumericFormat].allowDecimal
        ? ("decimal" as const)
        : ("numeric" as const),
      type: "text" as const,
    };
  }
  return { inputMode: undefined, type: "text" as const };
}

function initialValue(value: NativeInputProps["value"] | undefined) {
  if (Array.isArray(value)) return value.join(",");
  return value === undefined ? "" : String(value);
}

function FormattedInput({
  customRegExp,
  defaultValue,
  format = "text",
  maxDecimalPlaces,
  onChange,
  onCompositionEnd,
  onCompositionStart,
  onValueChange,
  transform = "none",
  value,
  ...props
}: FormattedInputProps) {
  const lastAcceptedValue = useRef(initialValue(value ?? defaultValue));
  const isComposing = useRef(false);
  const skippedChangeValue = useRef<string | null>(null);
  const presentation = inputPresentation(format);

  useEffect(() => {
    if (value !== undefined) lastAcceptedValue.current = initialValue(value);
  }, [value]);

  function commitValue(
    event: ChangeEvent<HTMLInputElement> | CompositionEvent<HTMLInputElement>,
    nextValue: string,
  ) {
    const transformedValue = transformFormattedInputValue(nextValue, transform);
    if (!isFormattedInputValue(transformedValue, { customRegExp, format, maxDecimalPlaces })) {
      event.currentTarget.value = lastAcceptedValue.current;
      return;
    }

    event.currentTarget.value = transformedValue;
    lastAcceptedValue.current = transformedValue;
    onChange?.(event as ChangeEvent<HTMLInputElement>);
    onValueChange?.(transformedValue);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nativeIsComposing = (event.nativeEvent as InputEvent).isComposing;
    if (shouldDeferFormattedInputChange(isComposing.current, nativeIsComposing)) return;

    const nextValue = event.currentTarget.value;
    if (skippedChangeValue.current === nextValue) {
      skippedChangeValue.current = null;
      return;
    }
    commitValue(event, nextValue);
  }

  return (
    <input
      data-slot="formatted-input"
      {...props}
      defaultValue={defaultValue}
      inputMode={presentation.inputMode}
      onChange={handleChange}
      onCompositionEnd={(event) => {
        isComposing.current = false;
        const nextValue = event.currentTarget.value;
        if (nextValue !== lastAcceptedValue.current) {
          commitValue(event, nextValue);
          skippedChangeValue.current = event.currentTarget.value;
        }
        onCompositionEnd?.(event);
      }}
      onCompositionStart={(event) => {
        isComposing.current = true;
        onCompositionStart?.(event);
      }}
      type={presentation.type}
      value={value}
    />
  );
}

export { FormattedInput };
