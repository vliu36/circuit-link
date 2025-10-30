/*"use server"
export default async function MemberCount({ commName }: { commName: string }) {
  try {
    const res = await fetch(`http://localhost:2400/api/comm/${commName}`, { 
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  const data = await res.json(); 
    return <>{data.numUsers}</>;

  } catch (error) {
    console.error(error);
    return <>--</>;
  }
}*/