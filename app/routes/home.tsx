import type { Route } from "./+types/home";
import BrowserLLM from "~/components/BrowserLLM";
import { Selector } from "~/components/Selector";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Selector />;
}
