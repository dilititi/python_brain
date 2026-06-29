import {
  abilityDimensionMeta,
  abilityDimensionOrder,
  type AbilityDimension
} from "../data/philosophy/abilities";

export type AbilityContentEntry = {
  id: string;
  data: {
    abilities?: readonly AbilityDimension[];
    title?: string;
    [key: string]: unknown;
  };
};

export function groupPhilosophyContentByAbility<
  TNotion extends AbilityContentEntry,
  TQuestion extends AbilityContentEntry
>({
  notions,
  questions
}: {
  notions: readonly TNotion[];
  questions: readonly TQuestion[];
}) {
  return abilityDimensionOrder.map((ability) => {
    const relatedNotions = notions.filter((notion) => notion.data.abilities?.includes(ability));
    const relatedQuestions = questions.filter((question) => question.data.abilities?.includes(ability));

    return {
      ability,
      meta: abilityDimensionMeta[ability],
      notions: relatedNotions,
      questions: relatedQuestions,
      total: relatedNotions.length + relatedQuestions.length
    };
  });
}
