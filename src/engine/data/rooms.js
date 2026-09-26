// Special rooms host the meeting and the investigation checks.
// Work rooms are where robots get assigned to do the day's task.
export const ROOMS = [
  { id: 'kitchen', name: 'Kitchen', role: 'meeting' },
  { id: 'security', name: 'Security', role: 'camera' },
  { id: 'office', name: 'Office', role: 'keys' },
  { id: 'living', name: 'Living room', role: 'question' },
  { id: 'garage', name: 'Garage', role: 'test' },
  { id: 'bedroom', name: 'Bedroom', role: 'work' },
  { id: 'kids', name: "Kids' room", role: 'work' },
  { id: 'hallway', name: 'Hallway', role: 'work' },
  { id: 'utility', name: 'Utility room', role: 'work' },
  { id: 'garden', name: 'Garden', role: 'work' },
];

// Rooms a robot can be assigned to for the work phase (any non-special room plus
// kitchen/living/garage, which double as ordinary household spaces during the day).
export const WORK_ROOM_IDS = ['kitchen', 'living', 'garage', 'bedroom', 'kids', 'hallway', 'utility', 'garden'];

// Which room each investigation check happens in.
export const CHECK_ROOMS = { camera: 'security', keys: 'office', question: 'living', test: 'garage' };

export const roomById = (id) => ROOMS.find((r) => r.id === id);
