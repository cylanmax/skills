'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  id: string;
  name: string;
  value: string;
  options: readonly SearchableSelectOption[];
  onValueChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
};

function filterOptions(options: readonly SearchableSelectOption[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return options;

  return options.filter(option =>
    `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery),
  );
}

function firstEnabledIndex(options: readonly SearchableSelectOption[]) {
  return options.findIndex(option => !option.disabled);
}

function moveActiveIndex(
  options: readonly SearchableSelectOption[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (!options.length) return -1;

  const start = currentIndex === -1
    ? direction === 1 ? -1 : 0
    : currentIndex;

  for (let step = 1; step <= options.length; step += 1) {
    const index = (start + direction * step + options.length) % options.length;
    if (!options[index].disabled) return index;
  }

  return -1;
}

export function SearchableSelect({
  id,
  name,
  value,
  options,
  onValueChange,
  required,
  disabled,
  invalid,
  describedBy,
  placeholder = 'Search or choose an option',
}: SearchableSelectProps) {
  const generatedId = useId();
  const listId = `${id}-options-${generatedId.replaceAll(':', '')}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedOption = options.find(option => option.value === value);
  const filteredOptions = isSearching ? filterOptions(options, query) : options;
  const displayValue = isOpen && isSearching ? query : selectedOption?.label || '';

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && !value ? 'Choose an option from the list.' : '',
    );
  }, [required, value]);

  function openOptions() {
    setIsOpen(true);
    setIsSearching(false);
    setQuery('');
    setActiveIndex(firstEnabledIndex(options));
  }

  function closeOptions() {
    setIsOpen(false);
    setIsSearching(false);
    setQuery('');
    setActiveIndex(-1);
  }

  function selectOption(option: SearchableSelectOption) {
    if (option.disabled) return;
    onValueChange(option.value);
    closeOptions();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openOptions();
        return;
      }

      setActiveIndex(current => moveActiveIndex(
        filteredOptions,
        current,
        event.key === 'ArrowDown' ? 1 : -1,
      ));
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option && !option.disabled) selectOption(option);
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeOptions();
    }
  }

  return (
    <div className="searchable-select">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onFocus={event => {
          openOptions();
          event.currentTarget.select();
        }}
        onChange={event => {
          const nextQuery = event.target.value;
          const nextOptions = filterOptions(options, nextQuery);
          setQuery(nextQuery);
          setIsSearching(true);
          setIsOpen(true);
          setActiveIndex(firstEnabledIndex(nextOptions));
        }}
        onKeyDown={handleKeyDown}
        onBlur={closeOptions}
      />
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="searchable-select-toggle"
        tabIndex={-1}
        aria-label={isOpen ? 'Close options' : 'Open options'}
        aria-expanded={isOpen}
        disabled={disabled}
        onMouseDown={event => event.preventDefault()}
        onClick={() => {
          if (isOpen) closeOptions();
          else {
            inputRef.current?.focus();
            openOptions();
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m3.5 6 4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div id={listId} className="searchable-select-options" role="listbox">
          {filteredOptions.length ? filteredOptions.map((option, index) => (
            <div
              id={`${listId}-${index}`}
              key={option.value}
              className="searchable-select-option"
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              data-active={index === activeIndex || undefined}
              onMouseDown={event => event.preventDefault()}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </div>
          )) : (
            <p className="searchable-select-empty" role="status">No matching options.</p>
          )}
        </div>
      )}
    </div>
  );
}
