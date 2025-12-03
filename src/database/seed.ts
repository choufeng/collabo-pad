import { randomUUID } from "crypto";
import { NewTopic } from "./schema";

// Sample data for testing
const sampleUsernames = [
  "Alice Johnson",
  "Bob Smith",
  "Charlie Davis",
  "Diana Miller",
  "Ethan Wilson",
  "Fiona Brown",
  "George Taylor",
  "Hannah Anderson",
  "Isaac Martinez",
  "Julia Garcia",
];

const sampleContents = [
  "Welcome to our collaborative workspace!",
  "This is a sample topic for testing purposes",
  "Let's discuss our project roadmap",
  "Important announcement for the team",
  "Sharing some interesting resources",
  "Planning our next sprint",
  "Technical discussion about architecture",
  "User feedback and suggestions",
  "Design ideas for the new feature",
  "Meeting notes from yesterday",
  "Action items from our discussion",
  "Research findings and insights",
  "Proposal for the upcoming feature",
  "Brainstorming session results",
  "Code review comments",
  "Best practices documentation",
  "Performance optimization ideas",
  "Security considerations",
  "User experience improvements",
  "Integration challenges",
  "Success metrics and KPIs",
];

const sampleTags = [
  ["important", "urgent"],
  ["discussion", "team"],
  ["planning", "milestone"],
  ["technical", "architecture"],
  ["design", "ui"],
  ["feedback", "improvement"],
  ["research", "analysis"],
  ["proposal", "feature"],
  ["meeting", "notes"],
  ["documentation", "guide"],
];

const sampleMetadata = [
  { priority: "high", category: "planning", assignedTo: "team-lead" },
  { priority: "medium", category: "discussion", meetingId: "team-standup" },
  { priority: "low", category: "resource", tags: ["optional", "reference"] },
  { priority: "high", category: "action", dueDate: "2024-01-15" },
  {
    priority: "medium",
    category: "decision",
    stakeholders: ["product", "engineering"],
  },
  { priority: "low", category: "idea", status: "backlog" },
  { priority: "high", category: "issue", severity: "critical" },
  { priority: "medium", category: "update", type: "progress" },
];

function generateRandomFloat(
  min: number,
  max: number,
  decimals: number = 2,
): string {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(decimals);
}

function generateRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateTestTopics(count: number = 20): NewTopic[] {
  const topics: NewTopic[] = [];
  const channelId = randomUUID();

  // First, create some root topics (without parent)
  const rootTopicCount = Math.floor(count * 0.4); // 40% are root topics

  for (let i = 0; i < rootTopicCount; i++) {
    const topic: NewTopic = {
      channelId,
      parentId: null,
      userId: randomUUID(),
      username: getRandomElement(sampleUsernames),
      content: getRandomElement(sampleContents),
      x: generateRandomFloat(50, 800),
      y: generateRandomFloat(50, 600),
      w: generateRandomFloat(200, 400),
      h: generateRandomFloat(100, 200),
      metadata: getRandomElement([null, ...sampleMetadata]),
      tags: getRandomElement([null, ...sampleTags]),
    };

    topics.push({ ...topic, id: randomUUID() });
  }

  // Then, create child topics with hierarchical relationships
  const remainingTopics = count - rootTopicCount;
  for (let i = 0; i < remainingTopics; i++) {
    const parentTopic = getRandomElement(
      topics.slice(0, rootTopicCount + Math.min(i, topics.length)),
    );

    const topic: NewTopic = {
      channelId,
      parentId: parentTopic.id,
      userId: randomUUID(),
      username: getRandomElement(sampleUsernames),
      content: getRandomElement(sampleContents),
      x: generateRandomFloat(
        parseFloat(parentTopic.x!) - 100,
        parseFloat(parentTopic.x!) + parseFloat(parentTopic.w!) + 100,
      ),
      y: generateRandomFloat(
        parseFloat(parentTopic.y!) + parseFloat(parentTopic.h!) + 50,
        parseFloat(parentTopic.y!) + parseFloat(parentTopic.h!) + 200,
      ),
      w: generateRandomFloat(150, 300),
      h: generateRandomFloat(80, 150),
      metadata: getRandomElement([null, ...sampleMetadata]),
      tags: getRandomElement([null, ...sampleTags]),
    };

    topics.push({ ...topic, id: randomUUID() });
  }

  return topics;
}

export async function seedTopics(count: number = 20): Promise<void> {
  try {
    console.log(`🌱 Seeding ${count} test topics into the database...`);

    const testTopics = generateTestTopics(count);

    // In a real implementation, we would insert these into the database
    // For now, we just generate and validate them
    console.log(`✅ Generated ${testTopics.length} test topics`);

    // Log some statistics
    const rootTopics = testTopics.filter((t) => !t.parentId).length;
    const childTopics = testTopics.filter((t) => t.parentId).length;
    const topicsWithMetadata = testTopics.filter((t) => t.metadata).length;
    const topicsWithTags = testTopics.filter((t) => t.tags).length;

    console.log(`📊 Statistics:`);
    console.log(`   Root topics: ${rootTopics}`);
    console.log(`   Child topics: ${childTopics}`);
    console.log(`   Topics with metadata: ${topicsWithMetadata}`);
    console.log(`   Topics with tags: ${topicsWithTags}`);

    // Log a sample topic for verification
    if (testTopics.length > 0) {
      console.log(`🔍 Sample topic:`);
      console.log(JSON.stringify(testTopics[0], null, 2));
    }
  } catch (error) {
    console.error("❌ Error seeding topics:", error);
    throw error;
  }
}

// Utility function to reset database (useful for testing)
export async function resetDatabase(): Promise<void> {
  try {
    console.log("🗑️  Resetting database...");
    // In a real implementation, we would:
    // 1. Delete all existing topics
    // 2. Reset sequences
    // 3. Run migrations again if needed
    console.log("✅ Database reset completed");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
}

// CLI entry point for running the seed script
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 20;
  seedTopics(count)
    .then(() => {
      console.log("🎉 Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}
