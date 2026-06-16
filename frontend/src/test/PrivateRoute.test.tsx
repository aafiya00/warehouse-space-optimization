import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

// Simple PrivateRoute component matching the one in App.tsx
function PrivateRoute({ children, user }: { children: React.ReactNode; user: any }) {
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

const ProtectedPage = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

const renderWithAuth = (user: any) =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user}>
              <ProtectedPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("PrivateRoute Guard", () => {
  it("renders protected content when user is logged in", () => {
    renderWithAuth({ username: "admin", role: "admin" });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to login when user is null", () => {
    renderWithAuth(null);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to login when user is undefined", () => {
    renderWithAuth(undefined);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders content for any authenticated user role", () => {
    renderWithAuth({ username: "staff1", role: "staff" });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});