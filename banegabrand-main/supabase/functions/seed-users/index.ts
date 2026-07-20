import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "owner" | "admin" | "hr_manager" | "tl" | "employee";

// Define users for both companies
const USERS: { email: string; password: string; name: string; role: AppRole; company?: string }[] = [
  
  // Sultan Wellness Users
  { email: "sultanwellness.owner@gmail.com", password: "SultanWellness@Owner1", name: "Sultan Wellness Owner", role: "owner", company: "SultanWellness" },
  { email: "sultanwellness.admin@gmail.com", password: "SultanWellness@Admin1", name: "Sultan Wellness Admin", role: "admin", company: "SultanWellness" },
  { email: "sultanwellness.hr@gmail.com", password: "SultanWellness@Hr1", name: "Sultan Wellness HR", role: "hr_manager", company: "SultanWellness" },
  { email: "sultanwellness.tl@gmail.com", password: "SultanWellness@Tl1", name: "Sultan Wellness Team Lead", role: "tl", company: "SultanWellness" },
  { email: "sultanwellness.ahmed@gmail.com", password: "SultanWellness@Emp1", name: "Ahmed Khan", role: "employee", company: "SultanWellness" },
  { email: "sultanwellness.fatima@gmail.com", password: "SultanWellness@Emp2", name: "Fatima Noor", role: "employee", company: "SultanWellness" },
  { email: "sultanwellness.omar@gmail.com", password: "SultanWellness@Emp3", name: "Omar Hassan", role: "employee", company: "SultanWellness" },
];

async function ensureUserProfile(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  name: string,
  email: string,
  company?: string
) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  const profileData = {
    user_id: userId,
    display_name: name,
    email: email,
    employee_status: 'active',
    // Add company/department info if needed
    department: company || 'General',
    updated_at: new Date().toISOString(),
  };

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId);
    
    if (error) {
      console.error(`Error updating profile for ${email}:`, error);
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from("profiles")
      .insert({
        ...profileData,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error(`Error creating profile for ${email}:`, error);
    }
  }
}

async function ensureRole(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  role: AppRole
) {
  try {
    // Check if user already has this role
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", userId)
      .eq("role", role);

    if (!existing || existing.length === 0) {
      // Insert the role
      const { error } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: userId, 
          role: role,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error assigning role ${role} to user ${userId}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error(`Error in ensureRole for user ${userId}:`, error);
    throw error;
  }
}

async function ensureUser(
  supabase: ReturnType<typeof createClient>,
  user: typeof USERS[0]
): Promise<{ status: string; userId?: string; error?: string }> {
  try {
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const found = existingUsers.users.find(
      (x) => x.email?.toLowerCase() === user.email.toLowerCase()
    );

    let userId = found?.id;

    if (found) {
      // Update existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        found.id,
        {
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.name, company: user.company },
        }
      );

      if (updateError) {
        return { status: "error", error: updateError.message };
      }

      // Update or create profile
      await ensureUserProfile(supabase, found.id, user.name, user.email, user.company);
      
      return { status: "updated", userId: found.id };
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { 
          full_name: user.name,
          company: user.company 
        },
      });

      if (error) {
        return { status: "error", error: error.message };
      }

      userId = data.user?.id;
      
      if (userId) {
        // Create profile
        await ensureUserProfile(supabase, userId, user.name, user.email, user.company);
        
        return { status: "created", userId };
      }
      
      return { status: "error", error: "Failed to get user ID after creation" };
    }
  } catch (error) {
    return { 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results: {
      email: string;
      name: string;
      company?: string;
      status: string;
      userId?: string;
      error?: string;
    }[] = [];

    // Process each user
    for (const user of USERS) {
      console.log(`Processing user: ${user.email} (${user.company})`);
      
      const result = await ensureUser(supabase, user);
      
      // Assign role if user was created/updated successfully
      if (result.userId && result.status !== "error") {
        try {
          await ensureRole(supabase, result.userId, user.role);
        } catch (roleError) {
          result.error = `Role assignment failed: ${roleError instanceof Error ? roleError.message : 'Unknown error'}`;
        }
      }

      results.push({
        email: user.email,
        name: user.name,
        company: user.company,
        status: result.status,
        userId: result.userId,
        error: result.error,
      });
    }

    // Summary statistics
    const stats = {
      total: results.length,
      created: results.filter(r => r.status === "created").length,
      updated: results.filter(r => r.status === "updated").length,
      errors: results.filter(r => r.status === "error" || r.error).length,
    };

    console.log("Setup completed:", stats);

    return new Response(
      JSON.stringify({
        ok: true,
        stats,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});