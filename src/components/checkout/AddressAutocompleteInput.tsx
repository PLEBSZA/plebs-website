"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-places/load";
import {
  parseSaAddressComponents,
  type ParsedSaAddress,
} from "@/lib/google-places/parse-sa-address";

type AddressAutocompleteInputProps = {
  name: string;
  autoComplete?: string;
  required?: boolean;
  /** Form field name prefix, e.g. "shipping" → shippingSuburb, shippingCity */
  fieldPrefix: "shipping" | "billing";
};

function setInputValue(form: HTMLFormElement, name: string, value: string) {
  const element = form.elements.namedItem(name);
  if (!(element instanceof HTMLInputElement)) return;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyParsedAddress(
  form: HTMLFormElement,
  prefix: "shipping" | "billing",
  address: ParsedSaAddress,
) {
  if (address.line1) setInputValue(form, `${prefix}Line1`, address.line1);
  if (address.suburb) setInputValue(form, `${prefix}Suburb`, address.suburb);
  if (address.city) setInputValue(form, `${prefix}City`, address.city);
  if (address.province) {
    setInputValue(form, `${prefix}Province`, address.province);
  }
  if (address.postalCode) {
    setInputValue(form, `${prefix}PostalCode`, address.postalCode);
  }
  if (address.country) {
    setInputValue(form, `${prefix}Country`, address.country);
  }
}

export function AddressAutocompleteInput({
  name,
  autoComplete = "street-address",
  required,
  fieldPrefix,
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;
    let listener: google.maps.MapsEventListener | null = null;

    void (async () => {
      const maps = await loadGoogleMaps();
      if (cancelled || !maps || !input.isConnected) return;

      try {
        await maps.importLibrary("places");
        if (cancelled || !input.isConnected) return;

        autocomplete = new google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: "za" },
          fields: ["address_components", "name"],
          types: ["address"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const parsed = parseSaAddressComponents(place?.address_components);
          if (!parsed) return;

          const form = input.form;
          if (!form) return;

          // Prefer structured street line; fall back to the typed prediction text.
          if (!parsed.line1 && place?.name) {
            parsed.line1 = place.name;
          }

          applyParsedAddress(form, fieldPrefix, parsed);

          // Leave focus on apartment / suburb so the user can tweak unit details.
          const next =
            (form.elements.namedItem(`${fieldPrefix}Line2`) as HTMLInputElement | null) ??
            (form.elements.namedItem(`${fieldPrefix}Suburb`) as HTMLInputElement | null);
          next?.focus();
        });
      } catch (error) {
        console.warn("Google Places autocomplete unavailable.", error);
      }
    })();

    return () => {
      cancelled = true;
      if (listener) {
        listener.remove();
      }
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [fieldPrefix]);

  return (
    <input
      ref={inputRef}
      name={name}
      autoComplete={autoComplete}
      required={required}
      placeholder="Start typing your street address"
    />
  );
}
