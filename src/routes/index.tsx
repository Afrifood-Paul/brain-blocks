// import { Link, createFileRoute } from "@tanstack/react-router";

// export const Route = createFileRoute("/")({
//   component: Home,
// });

// function Home() {
//   return (
//     <main className="min-h-screen bg-background px-4 py-5 text-foreground">
//       <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md flex-col">
//         <nav className="flex items-center justify-between gap-3">
//           <Link to="/" className="text-lg font-bold">
//             Brain Blocks
//           </Link>
//           <div className="flex items-center gap-2">
//             <Link
//               to="/login"
//               className="rounded-full px-4 py-2 text-sm font-semibold text-foreground"
//             >
//               Log in
//             </Link>
//             <Link
//               to="/register"
//               className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
//             >
//               Register
//             </Link>
//           </div>
//         </nav>

//         <section className="flex flex-1 flex-col justify-center py-12">
//           <p className="text-sm font-semibold text-primary">Play. Earn. Redeem.</p>
//           <h1 className="mt-3 text-4xl font-bold leading-tight">Brain Blocks</h1>
//           <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
//             Challenge players, grow your coin balance, and redeem rewards from the marketplace.
//           </p>
//           <div className="mt-8 flex gap-3">
//             <Link
//               to="/register"
//               className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
//             >
//               Get Started
//             </Link>
//             <Link to="/login" className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold">
//               Log in
//             </Link>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [activeNav, setActiveNav] = useState("Home");
  const [cartCount, setCartCount] = useState(0);

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: "#f0f4ff",
        color: "#1a1a2e",
        minHeight: "100vh",
      }}
    >
      {/* Paste ALL your JSX here */}

      {/* Example */}
      <nav>
        {/* navbar */}
      </nav>

      <section>
        {/* hero */}
      </section>

      <footer>
        {/* footer */}
      </footer>
    </div>
  );
}