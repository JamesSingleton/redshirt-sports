import {
  ADDRESS_MAX_ENTRIES,
  ADDRESS_TTL_MS,
  createPlayerAddressCache,
} from "@/lib/player-address-cache";

describe("player address cache", () => {
  it("asks once per player until the entry expires", async () => {
    let clock = 0;
    const load = vi.fn(async (id: number) => ({ id, slug: "jalen-brooks" }));
    const address = createPlayerAddressCache(load, () => clock);

    expect(await address(100000)).toEqual({ id: 100000, slug: "jalen-brooks" });
    expect(await address(100000)).toEqual({ id: 100000, slug: "jalen-brooks" });
    expect(load).toHaveBeenCalledTimes(1);

    clock = ADDRESS_TTL_MS - 1;
    await address(100000);
    expect(load).toHaveBeenCalledTimes(1);
    clock = ADDRESS_TTL_MS;
    await address(100000);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("remembers that a player doesn't exist", async () => {
    const load = vi.fn(async () => null);
    const address = createPlayerAddressCache(load);
    expect(await address(999999)).toBeNull();
    expect(await address(999999)).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("drops the oldest entry past the cap", async () => {
    const load = vi.fn(async (id: number) => ({ id, slug: "p" }));
    const address = createPlayerAddressCache(load, () => 0);
    for (let id = 0; id <= ADDRESS_MAX_ENTRIES; id++) await address(id);
    load.mockClear();
    // The newest is still held; the first one written was dropped.
    await address(ADDRESS_MAX_ENTRIES);
    expect(load).not.toHaveBeenCalled();
    await address(0);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("doesn't cache a failed lookup", async () => {
    const load = vi
      .fn<(id: number) => Promise<{ id: number; slug: string } | null>>()
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce({ id: 100000, slug: "ok" });
    const address = createPlayerAddressCache(load);
    await expect(address(100000)).rejects.toThrow("db down");
    expect(await address(100000)).toEqual({ id: 100000, slug: "ok" });
  });
});
