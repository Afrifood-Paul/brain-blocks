import Register from "@/pages/register/Register";
import { createFileRoute } from "@tanstack/react-router";
import { redirectIfAuthenticated } from "@/router/guards";

export const Route = createFileRoute("/register")({
  beforeLoad: redirectIfAuthenticated,
  component: Register,
});


// import Register from "@/pages/register/Register";
// import { createFileRoute } from "@tanstack/react-router";
// import { redirectIfAuthenticated } from "@/router/guards";

// export const Route = createFileRoute("/register")({
//   beforeLoad: redirectIfAuthenticated,
//   component: Register,

//   validateSearch: (search: Record<string, unknown>) => {
//     return {
//       ref: typeof search.ref === "string" ? search.ref : undefined,
//     };
//   },
// });