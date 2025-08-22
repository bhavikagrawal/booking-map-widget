// src/app/actions.ts
'use server'

import { stallRecommendation } from "@/ai/flows/stall-recommendation"
import type { Stall, ExhibitionData } from "@/lib/types"

export async function getStallRecommendation(selectedStall: Stall, exhibitionData: ExhibitionData) {
  const allStalls: Stall[] = Object.values(exhibitionData.stalls);

  const stallCategories = [...new Set(allStalls.map(stall => stall.category).filter(Boolean))];
  const stallSegments = [...new Set(allStalls.map(stall => stall.segment).filter(Boolean))];
  
  try {
    const result = await stallRecommendation({
      selectedStallCategory: selectedStall.category,
      selectedStallSegment: selectedStall.segment,
      stallCategories,
      stallSegments
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("AI Stall Recommendation Error:", error);
    return { success: false, error: "Failed to get recommendations. Please try again later." };
  }
}
