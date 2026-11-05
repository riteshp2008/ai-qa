import { NextResponse } from "next/server";

import { validateCreateProjectRequest } from "@/domain/projects/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, target_url, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load projects: ${error.message}`);
    }

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error("Project listing failed.", error);
    return NextResponse.json({ message: "Unable to load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = validateCreateProjectRequest(await request.json().catch(() => null));
  if (!validation.value) {
    return NextResponse.json({ message: "Invalid project request.", errors: validation.errors }, { status: 400 });
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: validation.value.name,
        target_url: validation.value.targetUrl,
      })
      .select("id, name, target_url, created_at")
      .single();

    if (error) {
      throw new Error(`Unable to create project: ${error.message}`);
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error("Project creation failed.", error);
    return NextResponse.json({ message: "Unable to create project." }, { status: 500 });
  }
}
