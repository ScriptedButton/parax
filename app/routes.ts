import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("paraphrase", "routes/paraphrase.tsx"),
    route("multi", "routes/multi.tsx"),
    route("diagram", "routes/diagram.tsx"),
  ]),
] satisfies RouteConfig;
