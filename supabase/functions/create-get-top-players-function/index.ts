
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables')
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // SQL for creating the function
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.get_top_players(limit_count integer DEFAULT 10)
        RETURNS TABLE(
          user_id uuid,
          username text,
          photo_url text,
          total_winnings numeric
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            u.id as user_id,
            u.username,
            u.photo_url,
            COALESCE(SUM(g.value), 0) as total_winnings
          FROM
            public.users u
          LEFT JOIN
            public.gifts g ON u.id = g.user_id
          GROUP BY
            u.id, u.username, u.photo_url
          ORDER BY
            total_winnings DESC
          LIMIT limit_count;
        END;
        $$;
        
        -- Create exec_sql function if it doesn't exist
        CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `
    })
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
