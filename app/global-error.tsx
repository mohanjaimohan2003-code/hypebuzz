"use client";

import { useEffect } from "react";

export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error("Application root failed", { digest: error.digest ?? null, name: error.name, message: error.message });
  }, [error]);

  return <html lang="en"><body><main style={{alignItems:"center",display:"flex",fontFamily:"Arial, sans-serif",justifyContent:"center",minHeight:"100vh",padding:"1rem"}}><section style={{maxWidth:"32rem",textAlign:"center"}} role="alert"><h1>HypeBuzz is temporarily unavailable</h1><p>Please retry the page. If the problem continues, return in a few minutes.</p><button onClick={() => unstable_retry()} style={{background:"#2563EB",border:0,borderRadius:"10px",color:"white",cursor:"pointer",fontWeight:700,minHeight:"44px",padding:"0 1.25rem"}} type="button">Try again</button></section></main></body></html>;
}
