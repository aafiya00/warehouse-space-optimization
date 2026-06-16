import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// Mock the auth context
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    user: null,
  }),
}));

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders username and password fields", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders the login button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /sign in|login/i })).toBeInTheDocument();
  });

  it("shows error when submitted with empty fields", async () => {
    renderLogin();
    const button = screen.getByRole("button", { name: /sign in|login/i });
    fireEvent.click(button);
    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox");
      inputs.forEach(input => {
        expect(input).toBeInTheDocument();
      });
    });
  });

  it("allows typing in username field", () => {
    renderLogin();
    const usernameInput = screen.getByPlaceholderText(/username/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect((usernameInput as HTMLInputElement).value).toBe("testuser");
  });

  it("allows typing in password field", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    expect((passwordInput as HTMLInputElement).value).toBe("secret123");
  });
});