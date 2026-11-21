const { mockListPolls } = vi.hoisted(() => ({ mockListPolls: vi.fn() }));
vi.mock("@redshirt-sports/db/queries", () => ({ listPolls: mockListPolls }));

import type { Resend } from "resend";

import {
  DIGEST_TOPIC,
  ensureTopics,
  getCachedPollOptions,
  pollTopic,
  pollTopicName,
} from "@/lib/newsletter/topics";

const football = (name: string) => ({ name, sport: { name: "Football" } });
const hoops = {
  name: "Men's Basketball Mid-Major Top 25",
  sport: { name: "Men's Basketball" },
};

function resend(list: unknown, create?: unknown) {
  return {
    topics: {
      list: vi.fn().mockResolvedValue(list),
      create: vi.fn().mockResolvedValue(create),
    },
  };
}

describe("poll topics", () => {
  it("names a football poll with its sport, once", () => {
    expect(pollTopicName(football("FCS Top 25"))).toBe("Football: FCS Top 25");
    expect(pollTopicName(hoops)).toBe("Men's Basketball Mid-Major Top 25");
  });

  it("is opt-in", () => {
    expect(pollTopic(hoops).defaultSubscription).toBe("opt_out");
  });

  it("lists every active poll as a checkbox", async () => {
    mockListPolls.mockResolvedValue([{ id: "p1", ...football("FBS Top 25") }]);
    expect(await getCachedPollOptions()).toEqual([
      { id: "p1", label: "Football: FBS Top 25" },
    ]);
  });
});

describe("ensureTopics", () => {
  it("reuses topics by name and creates the missing ones", async () => {
    const client = resend(
      {
        data: { data: [{ id: "top_1", name: DIGEST_TOPIC.name }] },
        error: null,
      },
      { data: { id: "top_2" }, error: null },
    );
    const ids = await ensureTopics(client as unknown as Resend, [
      DIGEST_TOPIC,
      pollTopic(hoops),
    ]);
    expect([...ids]).toEqual([
      [DIGEST_TOPIC.name, "top_1"],
      [hoops.name, "top_2"],
    ]);
    expect(client.topics.create).toHaveBeenCalledOnce();
  });

  it("throws what Resend refused", async () => {
    const client = resend(
      { data: { data: [] }, error: null },
      { data: null, error: { message: "name too long" } },
    );
    await expect(
      ensureTopics(client as unknown as Resend, [pollTopic(hoops)]),
    ).rejects.toThrow(`Resend topic "${hoops.name}": name too long`);
  });
});
