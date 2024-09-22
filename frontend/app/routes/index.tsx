import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex items-center justify-center h-[90vh] gap-2 text-center flex-col">
      <h1 className="text-3xl font-bold">Main page</h1>
      <Button variant="outline">
        <Link to="/example">Click to go to example page</Link>
      </Button>
    </div>
  );
}
