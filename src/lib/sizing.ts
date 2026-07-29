/**
 * Finished garment measurements for PLEBS cotton corduroy dungarees.
 *
 * XS and S values are converted from the supplier size chart (inches → cm).
 * M, L and XL are extrapolated using the observed XS→S grade increments.
 * Mark extrapolated sizes clearly in UI copy.
 */

export type SizeCode = "XS" | "S" | "M" | "L" | "XL";

export type GarmentMeasurementsCm = {
  waist: number;
  hips: number;
  frontBib: number;
  backBib: number;
  thighWidth: number;
  kneeWidth: number;
  legWidth: number;
  frontBibTopWidth: number;
  backBibTopWidth: number;
  strapLength: number;
  strapWidth: number;
  length: number;
  /** True when values were graded from the confirmed XS→S increment. */
  extrapolated: boolean;
};

const INCH_TO_CM = 2.54;

function cm(inches: number) {
  return Math.round(inches * INCH_TO_CM * 10) / 10;
}

/** Confirmed supplier chart (inches), converted to cm. */
const xsInches = {
  waist: 31.85,
  hips: 37.76,
  frontBib: 8.44,
  backBib: 8.44,
  thighWidth: 28.45,
  kneeWidth: 28.45,
  legWidth: 28.45,
  frontBibTopWidth: 8.44,
  backBibTopWidth: 8.44,
  strapLength: 15.97,
  strapWidth: 0.79,
  length: 43.88,
} as const;

const sInches = {
  waist: 33.85,
  hips: 39.76,
  frontBib: 9.44,
  backBib: 9.44,
  thighWidth: 28.7,
  kneeWidth: 28.7,
  legWidth: 28.7,
  frontBibTopWidth: 9.44,
  backBibTopWidth: 9.44,
  strapLength: 15.97,
  strapWidth: 0.79,
  length: 44.88,
} as const;

const grade = {
  waist: sInches.waist - xsInches.waist,
  hips: sInches.hips - xsInches.hips,
  frontBib: sInches.frontBib - xsInches.frontBib,
  backBib: sInches.backBib - xsInches.backBib,
  thighWidth: sInches.thighWidth - xsInches.thighWidth,
  kneeWidth: sInches.kneeWidth - xsInches.kneeWidth,
  legWidth: sInches.legWidth - xsInches.legWidth,
  frontBibTopWidth: sInches.frontBibTopWidth - xsInches.frontBibTopWidth,
  backBibTopWidth: sInches.backBibTopWidth - xsInches.backBibTopWidth,
  strapLength: 0,
  strapWidth: 0,
  length: sInches.length - xsInches.length,
} as const;

function fromInches(
  inches: Record<keyof typeof xsInches, number>,
  extrapolated: boolean,
): GarmentMeasurementsCm {
  return {
    waist: cm(inches.waist),
    hips: cm(inches.hips),
    frontBib: cm(inches.frontBib),
    backBib: cm(inches.backBib),
    thighWidth: cm(inches.thighWidth),
    kneeWidth: cm(inches.kneeWidth),
    legWidth: cm(inches.legWidth),
    frontBibTopWidth: cm(inches.frontBibTopWidth),
    backBibTopWidth: cm(inches.backBibTopWidth),
    strapLength: cm(inches.strapLength),
    strapWidth: cm(inches.strapWidth),
    length: cm(inches.length),
    extrapolated,
  };
}

function gradeFromS(steps: number): GarmentMeasurementsCm {
  return fromInches(
    {
      waist: sInches.waist + grade.waist * steps,
      hips: sInches.hips + grade.hips * steps,
      frontBib: sInches.frontBib + grade.frontBib * steps,
      backBib: sInches.backBib + grade.backBib * steps,
      thighWidth: sInches.thighWidth + grade.thighWidth * steps,
      kneeWidth: sInches.kneeWidth + grade.kneeWidth * steps,
      legWidth: sInches.legWidth + grade.legWidth * steps,
      frontBibTopWidth: sInches.frontBibTopWidth + grade.frontBibTopWidth * steps,
      backBibTopWidth: sInches.backBibTopWidth + grade.backBibTopWidth * steps,
      strapLength: sInches.strapLength,
      strapWidth: sInches.strapWidth,
      length: sInches.length + grade.length * steps,
    },
    true,
  );
}

export const garmentMeasurementsBySize: Record<SizeCode, GarmentMeasurementsCm> =
  {
    XS: fromInches(xsInches, false),
    S: fromInches(sInches, false),
    M: gradeFromS(1),
    L: gradeFromS(2),
    XL: gradeFromS(3),
  };

export const sizeOrder: SizeCode[] = ["XS", "S", "M", "L", "XL"];

export function formatCm(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, "")} cm`;
}

/**
 * Approximate body-measurement ranges derived from finished garment waist/hip
 * with ease for a relaxed dungaree. Use as guidance, not a medical/body chart.
 */
export const suggestedBodyRangesCm: Record<
  SizeCode,
  { waist: string; hip: string }
> = {
  XS: { waist: "70–78 cm", hip: "86–94 cm" },
  S: { waist: "78–86 cm", hip: "94–102 cm" },
  M: { waist: "86–94 cm", hip: "102–110 cm" },
  L: { waist: "94–102 cm", hip: "110–118 cm" },
  XL: { waist: "102–110 cm", hip: "118–126 cm" },
};

/** Photography / fit reference used across product and size-guide pages. */
export const modelFitInfo = {
  genderLabel: "Woman",
  heightM: 1.65,
  heightDisplay: "1.65 m",
  weightKg: 65,
  weightDisplay: "65 kg",
  sizeWorn: "S" as SizeCode,
  fitShown: "Relaxed dungaree fit as photographed",
  note: "All models shown wear Size S.",
} as const;

/**
 * Confirmed corduroy cloth for the PLEBS dungarees.
 * Fabric weight is GSM (grams per square metre), not finished garment weight.
 */
export const corduroyFabric = {
  fibre: "100% cotton",
  construction: "Corduroy",
  weightGsm: 350,
  weightDisplay: "350 GSM",
  stretch: "None — no elastane",
  wale: "Mid-wale rib",
  finish: "Natural cotton hand with a structured, light-catching rib",
  seasonalSuitability:
    "Year-round layering fabric; 350 GSM feels substantial in cooler weather without becoming a winter-only cloth",
  summary: "100% cotton corduroy, 350 GSM",
  handFeel:
    "A mid-weight cotton corduroy with enough body to hold the dungaree silhouette while staying soft enough for everyday wear.",
} as const;

/** Care instructions from the PLEBS sewn-in / label artwork. */
export const careInstructions = {
  fibre: "100% cotton corduroy",
  machineWash: "Yes — machine washable",
  waterTemperature: "Cold or lukewarm water",
  cycle: "Gentle cycle",
  insideOut: "Yes — turn inside out before washing",
  bleach: "Do not use bleach or harsh chemicals",
  drying: "Hang to dry / air-dry — avoid tumble drying to limit shrinkage",
  ironing:
    "If needed, iron on the reverse side on low heat; avoid pressing directly on the ribs",
  similarColours: "Wash with similar colours",
  materialNotes: [
    "100% cotton corduroy at 350 GSM, with no elastane on the care label.",
    "Corduroy has a raised mid-wale texture that can catch lint and flatten under heat or pressure.",
    "Cotton can shrink with high heat — hang-drying and cooler washing protect size and colour.",
  ],
} as const;
