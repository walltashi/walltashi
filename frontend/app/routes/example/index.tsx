import { Button } from "@/components/ui/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import ExampleComp from "./-components/ExampleComp";
import * as wasm from "@/lib/wasm/wasm";
import { useEffect } from "react";

export const Route = createFileRoute("/example/")({
  component: ExamplePage,
});

function ExamplePage() {
  useEffect(() => {
    console.log(wasm.sum(2, 3));
  }, []);
  return (
    <div className="flex items-center justify-center h-[90vh] flex-col gap-2 text-center">
      <h1 className="text-3xl font-bold">Example page</h1>
      <Button size="sm">
        <Link to="/">Click to go to main page</Link>
      </Button>
      <ExampleComp />
    </div>
  );
}
