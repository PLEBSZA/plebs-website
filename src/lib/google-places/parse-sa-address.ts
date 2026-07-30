export type ParsedSaAddress = {
  line1: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string | null;
  shortText?: string | null;
  types: string[];
};

function longName(component: AddressComponent | undefined) {
  return (component?.long_name || component?.longText || "").trim();
}

function shortName(component: AddressComponent | undefined) {
  return (component?.short_name || component?.shortText || "").trim();
}

function findComponent(components: AddressComponent[], ...types: string[]) {
  return components.find((component) =>
    types.some((type) => component.types.includes(type)),
  );
}

/**
 * Maps Google Places address components into a South African checkout shape:
 * street, suburb, city, province, postal code, country.
 */
export function parseSaAddressComponents(
  components: AddressComponent[] | null | undefined,
): ParsedSaAddress | null {
  if (!components?.length) return null;

  const streetNumber = longName(findComponent(components, "street_number"));
  const route = longName(findComponent(components, "route"));
  const premise = longName(findComponent(components, "premise"));
  const streetAddress = longName(findComponent(components, "street_address"));

  const line1 = [streetNumber, route || streetAddress || premise]
    .filter(Boolean)
    .join(" ")
    .trim();

  const suburb =
    longName(
      findComponent(
        components,
        "sublocality_level_1",
        "sublocality",
        "neighborhood",
        "sublocality_level_2",
      ),
    ) || "";

  let city =
    longName(
      findComponent(
        components,
        "locality",
        "postal_town",
        "administrative_area_level_2",
      ),
    ) || "";

  // In some SA results locality is the suburb; use admin level 2 as city.
  if (suburb && city && suburb.toLowerCase() === city.toLowerCase()) {
    city =
      longName(findComponent(components, "administrative_area_level_2")) ||
      city;
  }

  // If Google omitted sublocality but locality looks suburban and admin2 exists.
  if (!suburb && city) {
    const admin2 = longName(
      findComponent(components, "administrative_area_level_2"),
    );
    if (admin2 && admin2.toLowerCase() !== city.toLowerCase()) {
      return {
        line1,
        suburb: city,
        city: admin2,
        province: longName(
          findComponent(components, "administrative_area_level_1"),
        ),
        postalCode: longName(findComponent(components, "postal_code")),
        country:
          longName(findComponent(components, "country")) || "South Africa",
      };
    }
  }

  const province = longName(
    findComponent(components, "administrative_area_level_1"),
  );
  const postalCode = longName(findComponent(components, "postal_code"));
  const country =
    longName(findComponent(components, "country")) || "South Africa";

  if (!line1 && !suburb && !city && !postalCode) return null;

  return {
    line1,
    suburb,
    city,
    province: province || shortName(findComponent(components, "administrative_area_level_1")),
    postalCode,
    country,
  };
}
