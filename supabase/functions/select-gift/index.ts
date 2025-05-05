
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PossibleGift {
  id: string
  case_id: string
  name: string
  image_url: string
  value: number
  chance: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { gifts } = await req.json() as { gifts: PossibleGift[] }
    
    if (!gifts || !Array.isArray(gifts) || gifts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Gifts array is required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const selectedGift = selectGiftByProbability(gifts)
    
    return new Response(
      JSON.stringify({ gift: selectedGift }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error selecting gift:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to select a gift based on probability
function selectGiftByProbability(gifts: PossibleGift[]): PossibleGift {
  // Calculate cumulative probabilities
  const cumulativeProbabilities: number[] = []
  let cumulativeProbability = 0
  
  for (const gift of gifts) {
    cumulativeProbability += gift.chance
    cumulativeProbabilities.push(cumulativeProbability)
  }
  
  // Generate a random number between 0 and the total probability (should be 100)
  const random = Math.random() * cumulativeProbability
  
  // Find the gift that corresponds to the random number
  for (let i = 0; i < gifts.length; i++) {
    if (random <= cumulativeProbabilities[i]) {
      return gifts[i]
    }
  }
  
  // Default to the last gift if something went wrong
  return gifts[gifts.length - 1]
}
