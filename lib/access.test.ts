import { describe, expect, it, vi, beforeEach } from "vitest";

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

const { getDocumentAccess } = await import("@/lib/access");

const baseDocument = {
  id: "doc-1",
  title: "Q3 Plan",
  ownerId: "user-owner",
  owner: { id: "user-owner", name: "Owner", username: "owner" },
  shares: [
    { userId: "user-editor", permission: "edit", user: { id: "user-editor", name: "Editor", username: "editor" } },
    { userId: "user-viewer", permission: "view", user: { id: "user-viewer", name: "Viewer", username: "viewer" } },
  ],
};

beforeEach(() => {
  findUnique.mockReset();
});

describe("getDocumentAccess", () => {
  it("grants owner access to the document owner", async () => {
    findUnique.mockResolvedValue(baseDocument);
    const { access } = await getDocumentAccess("doc-1", "user-owner");
    expect(access).toBe("owner");
  });

  it("grants edit access to a user shared with edit permission", async () => {
    findUnique.mockResolvedValue(baseDocument);
    const { access } = await getDocumentAccess("doc-1", "user-editor");
    expect(access).toBe("edit");
  });

  it("grants only view access to a user shared with view permission", async () => {
    findUnique.mockResolvedValue(baseDocument);
    const { access } = await getDocumentAccess("doc-1", "user-viewer");
    expect(access).toBe("view");
  });

  it("denies access to a user with no ownership or share record", async () => {
    findUnique.mockResolvedValue(baseDocument);
    const { access, document } = await getDocumentAccess("doc-1", "user-stranger");
    expect(access).toBe("none");
    expect(document).not.toBeNull();
  });

  it("denies access when the document does not exist", async () => {
    findUnique.mockResolvedValue(null);
    const { access, document } = await getDocumentAccess("missing-doc", "user-owner");
    expect(access).toBe("none");
    expect(document).toBeNull();
  });
});
