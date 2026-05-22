"use server";

export async function updateEdgeConfig(data: Record<string, any>) {
  const updateResp = await fetch(
    `https://api.vercel.com/v1/edge-config/${new URL(process.env.EDGE_CONFIG!).pathname.split("/")[1]}/items`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
      body: JSON.stringify({
        items: Object.entries(data)
          .map(([key, value]) =>
            value
              ? {
                  operation: "update",
                  key,
                  value,
                }
              : null,
          )
          .filter((item) => item !== null),
      }),
    },
  );
  console.log(await updateResp.text());
  return updateResp.ok;
}
