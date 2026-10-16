/** 반복 조정하는 스킨 목록·가격·이미지 정보를 한곳에 둔다. */
export const skins = [
  { id: 'gold', name: 'Gold', price: 0, file: 'coin.png', texture: 'coin' },
  {
    id: 'silver',
    name: 'Silver',
    price: 50,
    file: 'skins/coin_silver.png',
    texture: 'coinSilver',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    price: 150,
    file: 'skins/coin_ruby.png',
    texture: 'coinRuby',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    price: 300,
    file: 'skins/coin_emerald.png',
    texture: 'coinEmerald',
  },
] as const;

export type SkinId = (typeof skins)[number]['id'];
export const isSkinId = (value: unknown): value is SkinId =>
  skins.some((skin) => skin.id === value);
export const skinById = (id: SkinId) => skins.find((skin) => skin.id === id)!;

export function nextSkinGoal(owned: readonly SkinId[]) {
  return skins.reduce<(typeof skins)[number] | null>(
    (target, skin) =>
      !owned.includes(skin.id) && (!target || skin.price < target.price)
        ? skin
        : target,
    null,
  );
}
