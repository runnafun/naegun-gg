import RosterManager from "./RosterManager";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RosterManager code={code.toUpperCase()} />;
}
