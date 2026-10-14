---
name: react-formatted-input
description: Add or repair reusable React form inputs, including IME-safe formatted text and numeric inputs plus searchable select dropdowns. Supports email, password, integers, decimals, custom regular expressions, case transforms, filtering options, and keyboard selection while preserving controlled form values. Use when building form input formatters, numeric restrictions, case normalization, searchable dropdowns, or fixing Pinyin/IME text leaking into validated fields.
---

# React Form Inputs

Use the bundled assets as implementation sources. They require React and TypeScript; copy the relevant component into the project's shared UI/component directory and adapt only project-local imports or styling. The searchable select uses an inline SVG and has no icon-library dependency.

## Integrate

1. Inspect the target form's state type, submission validation, and existing input styling.
2. Copy `assets/formatted-input.tsx` into an appropriate shared directory. Keep it client-side when the framework distinguishes client components.
3. Replace only fields that benefit from in-progress restrictions. Preserve `value`, `onChange`, `disabled`, `required`, `name`, and `className`.
4. Reuse the component's `format` presets instead of passing `type="number"`. Numeric presets render a text input with a numeric keyboard to reject `e`, extra minus signs, and invalid decimal syntax consistently.

```tsx
<FormattedInput
  format="positive-decimal"
  maxDecimalPlaces={2}
  value={price}
  onChange={(event) => setPrice(event.target.value)}
  className={inputClassName}
  required
/>

<FormattedInput
  format="positive-integer"
  value={stock}
  onChange={(event) => setStock(event.target.value)}
/>

<FormattedInput
  format="text"
  transform="lowercase"
  customRegExp={/^[a-z0-9-]*$/}
  value={code}
  onValueChange={setCode}
/>
```

## Add a searchable select

Use `assets/searchable-select.tsx` when a select has enough options to benefit from typing to filter. Copy `assets/searchable-select.css` too, or map its class names to the project's existing design system. It has no dependency on the formatted-input component.

1. Keep ordinary short option lists as native `<select>` controls. Enable the searchable component only for fields where search improves selection.
2. Pass options as `{ value, label, disabled? }[]`. The component searches both label and value without case sensitivity.
3. Keep `value` as the selected option's stable form value (usually an ID). The search query is temporary UI state; typing must not update the form value until an option is selected.
4. Preserve the field's label, `name`, `required`, `disabled`, invalid state, and description. The component submits the selected value through its hidden named input and provides a combobox/listbox for accessible interaction.
5. Keep required and business validation in the existing form validation. A query by itself is never a valid selection.

```tsx
<SearchableSelect
  id="propertyTypeId"
  name="propertyTypeId"
  value={propertyTypeId}
  options={propertyTypes.map(type => ({
    value: type.id,
    label: `${type.code} - ${type.name}`,
  }))}
  required
  onValueChange={nextId => setPropertyTypeId(nextId)}
/>
```

The component supports Arrow Up/Down, Enter, Escape, click selection, disabled options, and an empty-result message. Keep the original selected label visible when the query is cleared or the menu closes. Do not save the search text in place of the selected option value.

## Choose a format

- Use `email` or `password` to retain the native input type.
- Use `integer` or `decimal` for signed values.
- Use `positive-integer`, `positive-decimal`, or `positive-number` for non-negative values; use the negative variants when a leading minus sign is required.
- Apply `maxDecimalPlaces` only to decimal presets.
- Treat `customRegExp` as an additional condition and anchor it when restricting the whole value, for example `/^[A-Z0-9]*$/`.
- Use `transform="lowercase"`, `transform="uppercase"`, or `transform="titlecase"` to normalize accepted values before validation and publishing them. The default is `transform="none"`.
- For a lowercase slug, combine `transform="lowercase"` with a slug expression such as `/^[a-z0-9-]*$/`.

## Preserve IME and validation behavior

- Keep the input controlled and update parent state synchronously from `onChange` or `onValueChange`.
- Never publish partial IME composition to form state. Validate at composition end; restore the previous accepted value if the finished value is invalid.
- Keep empty input allowed during typing so the field can be cleared. Enforce required fields, numeric ranges, and business rules in the form's existing client/server validation.
- Do not rely on `min`, `max`, or `step` for numeric presets because their rendered type is `text`; validate those limits separately.
- Transform values before testing `customRegExp`; make the expression match the normalized value that the parent state receives.

## Verify

Copy `assets/formatted-input.test.ts` beside the formatted-input component when Vitest is available, adjusting its import if necessary. Test normal typing, paste, decimal precision, invalid characters, transforms, and Chinese IME composition. For searchable selects, verify case-insensitive search by label and value, click and keyboard selection, disabled options, empty results, restoring the selected label, and that the submitted value remains the selected ID. Run the project's focused tests, type check, and lint commands when available.
