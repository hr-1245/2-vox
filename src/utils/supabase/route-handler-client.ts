// utils/supabase/route-handler-client.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getSupabaseRouteHandler() {
  const cookieStore = await cookies() // ✅ Add await here
  return createRouteHandlerClient({ 
    cookies: () => cookieStore 
  })
}

export async function getCurrentUserFromRequest() {
  try {
    const supabase = await getSupabaseRouteHandler()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error in route handler:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Unexpected error in route handler:', error)
    return null
  }
}