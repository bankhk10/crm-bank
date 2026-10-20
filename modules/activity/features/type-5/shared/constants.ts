export const SURVEY_IMAGE_CATEGORIES = {
  BOTTLE: "SURVEY_BOTTLE",
  PROMOTION: "SURVEY_PROMO_MATERIAL",
} as const;

export type SurveyImageCategory =
  (typeof SURVEY_IMAGE_CATEGORIES)[keyof typeof SURVEY_IMAGE_CATEGORIES];
