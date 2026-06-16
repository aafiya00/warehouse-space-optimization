import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { username: "admin", role: "admin" },
    logout: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/" }),
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  };
});

import Layout from "../components/Layout";

describe("Layout / Sidebar", () => {
  it("renders the app brand name", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getAllByText(/WarehouseOS/i).length).toBeGreaterThan(0);
  });

  it("renders Dashboard nav link", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it("renders Suppliers nav link", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/Suppliers/i)).toBeInTheDocument();
  });

  it("renders Analytics nav link", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it("renders User Management link for admin", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });

  it("renders My Profile link", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
  });

  it("renders Logout button", () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});