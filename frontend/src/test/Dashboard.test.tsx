import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Import AFTER mocks
import Dashboard from "../pages/Dashboard";

describe("Dashboard Page", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { username: "admin", role: "admin" } });
  });

  it("renders without crashing for admin role", () => {
    mockUseAuth.mockReturnValue({ user: { username: "admin", role: "admin" } });
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(container).toBeTruthy();
  });

  it("renders without crashing for manager role", () => {
    mockUseAuth.mockReturnValue({ user: { username: "mgr", role: "manager" } });
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(container).toBeTruthy();
  });

  it("renders without crashing for staff role", () => {
    mockUseAuth.mockReturnValue({ user: { username: "staff1", role: "staff" } });
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});