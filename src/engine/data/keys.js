export const KEYS = [
  { id: 'bankCard', name: 'Bank card', important: true },
  { id: 'frontDoor', name: 'Front door key', important: true },
  { id: 'smartMeter', name: 'Smart meter access', important: true },
  { id: 'alarmPanel', name: 'Alarm panel code', important: true },
  { id: 'car', name: 'Car keys', important: true },
  { id: 'shed', name: 'Shed key', important: false },
  { id: 'pantry', name: 'Pantry key', important: false },
  { id: 'wifiGuest', name: 'Guest wifi password', important: false },
];

export const IMPORTANT_KEY_IDS = KEYS.filter((k) => k.important).map((k) => k.id);
export const HARMLESS_KEY_IDS = KEYS.filter((k) => !k.important).map((k) => k.id);
export const keyById = (id) => KEYS.find((k) => k.id === id);
export const isImportant = (id) => keyById(id)?.important === true;
