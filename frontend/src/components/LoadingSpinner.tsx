import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md", message, fullScreen = false,
}) => {
  const sizeClass = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" }[size];

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClass} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center items-center py-8">{spinner}</div>;
};

export default LoadingSpinner;
