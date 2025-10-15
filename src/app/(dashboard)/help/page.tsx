"use client";

export default function HelpPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Welcome to Help & Tutorials
        </h1>
        <p className="mb-4 text-gray-300">
          Please click on a tutorial from the sidebar to get started.
        </p>
        <p className="text-sm text-gray-400">
          Need a specific tutorial or have questions? Feel free to reach out
          through the feedback button!
        </p>
      </div>
    </div>
  );
}
