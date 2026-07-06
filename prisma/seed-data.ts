import { PrismaClient } from "@prisma/client";

export async function seedDatabase(prisma: PrismaClient) {
  const alice = await prisma.user.create({
    data: { username: "alice", name: "Alice Nakamura" },
  });
  const bob = await prisma.user.create({
    data: { username: "bob", name: "Bob Okafor" },
  });
  const carol = await prisma.user.create({
    data: { username: "carol", name: "Carol Mendes" },
  });

  const welcomeDoc = await prisma.document.create({
    data: {
      title: "Welcome to Ajaia Docs",
      ownerId: alice.id,
      content:
        "<h1>Welcome to Ajaia Docs</h1><p>This is a <strong>lightweight</strong> collaborative document editor. Try <em>formatting</em> text, adding <u>underlines</u>, or making a list:</p><ul><li>Create documents</li><li>Upload .txt/.md files to import them</li><li>Share documents with teammates</li></ul>",
    },
  });

  await prisma.share.create({
    data: { documentId: welcomeDoc.id, userId: bob.id, permission: "edit" },
  });

  await prisma.document.create({
    data: {
      title: "Bob's Draft Notes",
      ownerId: bob.id,
      content: "<h2>Draft Notes</h2><p>Nothing shared yet — this one is just mine.</p>",
    },
  });

  await prisma.document.create({
    data: {
      title: "Carol's Meeting Notes",
      ownerId: carol.id,
      content: "<h2>Meeting Notes</h2><p>Agenda, decisions, and follow-ups go here.</p>",
    },
  });

  return { alice: alice.username, bob: bob.username, carol: carol.username };
}
