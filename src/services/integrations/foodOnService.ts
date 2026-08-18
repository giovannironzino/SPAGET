import ontologyMap from '../../data/foodKnowledge/foodOntologyMap.json';

export interface FoodOnClassInfo {
  iri: string;
  preferredLabel: string;
  hierarchicalAncestors: string[];
}

export async function fetchFoodOnClassification(foodId: string): Promise<FoodOnClassInfo | null> {
  const cached = (ontologyMap as Record<string, any>)[foodId];
  if (cached) return cached;

  try {
    const res = await fetch(`https://www.ebi.ac.uk/ols4/api/v2/ontologies/foodon/classes?q=${encodeURIComponent(foodId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.elements && data.elements.length > 0) {
      const top = data.elements[0];
      return {
        iri: top.iri,
        preferredLabel: top.label || foodId,
        hierarchicalAncestors: ['food'],
      };
    }
  } catch (err) {
    console.warn('FoodOn OLS4 API offline fallback active:', err);
  }

  return null;
}
