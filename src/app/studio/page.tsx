import type { Metadata } from "next";
import { FreeEditor } from "@/components/free-editor";

export const metadata: Metadata = { title: "Free video editor" };

export default function StudioPage() {
  return <FreeEditor />;
}
