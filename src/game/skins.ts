/** 반복 조정하는 스킨 목록·가격·이미지 정보를 한곳에 둔다. */
export const skins = [
  {
    id: 'gold',
    name: 'Gold',
    price: 0,
    file: 'coin.png',
    texture: 'coin',
    perfectPalette: { color: 0xffb52e, highlight: 0xfffaf0 },
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 50,
    file: 'skins/coin_silver.png',
    texture: 'coinSilver',
    perfectPalette: { color: 0x63caff, highlight: 0xf0fbff },
  },
  {
    id: 'ruby',
    name: 'Ruby',
    price: 150,
    file: 'skins/coin_ruby.png',
    texture: 'coinRuby',
    perfectPalette: { color: 0xff3973, highlight: 0xffe5f0 },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    price: 300,
    file: 'skins/coin_emerald.png',
    texture: 'coinEmerald',
    perfectPalette: { color: 0x25e6a2, highlight: 0xe0fff3 },
  },
] as const;

export type SkinId = (typeof skins)[number]['id'];
export const isSkinId = (value: unknown): value is SkinId =>
  skins.some((skin) => skin.id === value);
export const skinById = (id: SkinId) => skins.find((skin) => skin.id === id)!;
