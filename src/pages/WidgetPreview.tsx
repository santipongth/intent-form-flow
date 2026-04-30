import { useParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function WidgetPreview() {
  const { agentId } = useParams<{ agentId: string }>();
  const src = `${SUPABASE_URL}/functions/v1/widget?agent_id=${agentId}&mode=fullpage&auto_open=true&preview=1`;

  return (
    <div className="w-full h-screen bg-muted/30 flex items-center justify-center">
      <iframe
        src={src}
        className="w-full h-full border-none"
        allow="microphone"
        title="Widget Preview"
      />
    </div>
  );
}
