import TeamEditor from "./TeamEditor";
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TeamEditor code={code.toUpperCase()} />;
}
