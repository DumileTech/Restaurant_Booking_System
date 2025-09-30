// utils/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js'; // <--- IMPORTANT: Import the base client

// Define a type for our custom options
interface CreateClientOptions {
  useServiceRole?: boolean;
}

// A cache for the service role client so we don't create it on every call
let serviceRoleClient: SupabaseClient | undefined;
  
export const createClient = async (options?: CreateClientOptions) => {
  console.log('[createClient] Initializing Supabase client creation...');

  // If the service role is requested, create a pure, admin-level client.
  // This client does not need cookies and is cached.
  if (options?.useServiceRole) {
    console.log('[createClient] Attempting to create a service role client.');

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[createClient] FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
    }

    // Use the cached client if it exists
    if (serviceRoleClient) {
      console.log('[createClient] Returning cached service role client.');
      return serviceRoleClient;
    }

    console.log('[createClient] No cached service role client found. Creating a new one.');
    // Create a new service role client using the base SupabaseClient constructor
    serviceRoleClient = new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Use the service key
      { auth: { persistSession: false } } // Server-side client, no need to persist sessions
    );
    console.log('[createClient] New service role client created successfully.');

    return serviceRoleClient;
  }

  // --- For all other cases, create a standard, user-session client ---
  console.log('[createClient] Creating a standard user-session client.');
  try {
    // Use provided cookieStore
    const cookieStore = await cookies();
    console.log('[createClient] Cookie store retrieved successfully.');

    const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use the anonymous key
    {
      cookies: {
        // The get method is straightforward.
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // The set and remove methods must be wrapped in try/catch blocks
        // because Server Components cannot write cookies. This is expected
        // behavior if you are using middleware to refresh the user's session.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.warn(`[createClient] Warning: Failed to set cookie '${name}' from a Server Component. This can be ignored if you have middleware refreshing cookies.`);
          }
        },
        remove(name: string, options: CookieOptions) {
            try {
            cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.warn(`[createClient] Warning: Failed to remove cookie '${name}' from a Server Component. This can be ignored if you have middleware refreshing cookies.`);
            }
      },
    },
    }
  );
    console.log('[createClient] Standard user-session client created successfully.');
    return client;
  } catch (error) {
    console.error('[createClient] CRITICAL ERROR: Failed to create standard user-session client.', error);
    throw error; // Re-throw the error after logging to ensure the application fails as expected.
  }
};