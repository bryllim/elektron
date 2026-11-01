import type { Metadata } from "next";
import Workspace from "@/components/Workspace";
export const metadata: Metadata = { title: "Elektron — Fleet operations" };
export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string | string[] }>;
}) {
  const params = await searchParams;
  return (
    <Workspace
      key={typeof params.case === "string" ? params.case : "overview"}
      initialCaseId={typeof params.case === "string" ? params.case : undefined}
    />
  );
}
