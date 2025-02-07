import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("paraphrase", "routes/paraphrase.tsx"),
  route("multi", "routes/multi.tsx"),
  route("diagram", "routes/diagram.tsx"),
] satisfies RouteConfig;
