/** Every user-facing string. A Hebrew file drops in beside this one later. */
export const en = {
  brand: { first: 'Toast', second: 'Turn' },

  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  home: {
    kicker: "This week it's",
    history: 'History',
    turnsSoFar: (turns: number, last: string) =>
      `${turns} ${turns === 1 ? 'turn' : 'turns'} so far · last made ${last}`,
    firstTurn: 'First turn on the board',
    nobodyYet: "No one's in the rotation yet. Add the first person.",
    addPeople: 'Add people',
  },

  lever: {
    label: "Pull the lever down to log this week's toast",
    idle: 'Pull the lever down when the toast is made',
    pulling: 'Keep pulling…',
    ready: 'Let go!',
    toasting: 'Toasting…',
    logged: (next: string, day: string) => `Logged. Next ${day} is on ${next}.`,
    loggedAlone: 'Logged.',
    done: (name: string) => `${name} did it! 🎉`,
  },

  history: {
    title: 'History',
    empty: 'No toast yet. Pull the lever when someone makes it.',
    notRated: 'not rated yet',
    skipped: 'nobody made it',
    logSkip: 'Nobody made toast this week',
  },

  swap: {
    title: (name: string) => `Swap with ${name}`,
    turns: (n: number) => `${n} ${n === 1 ? 'turn' : 'turns'}`,
    onHoliday: 'on holiday',
    alone: 'Add someone else to swap with.',
  },

  schedule: {
    title: 'Toast night',
    day: 'Day',
    time: 'Time',
    remind: 'Remind everyone that morning',
  },

  setup: {
    title: 'Set up the rotation',
    familyLabel: 'Family name',
    familyPlaceholder: 'The Cohens',
    peopleLabel: 'Who makes toast',
    namePlaceholder: 'Name',
    add: 'Add',
    remove: (name: string) => `Remove ${name}`,
    moveUp: (name: string) => `Move ${name} earlier`,
    moveDown: (name: string) => `Move ${name} later`,
    empty: "No one's in the rotation yet. Add the first person.",
    start: 'Start the rotation',
    save: 'Done',
    editTitle: 'Who makes toast',
    dragHint: 'Drag a name to change the order',
    colourLabel: 'Colour',
    dragLabel: (name: string) => `Reorder ${name}`,
  },

  settings: {
    title: 'Settings',
    open: 'Settings',
    holiday: 'On holiday',
    editPeople: 'Add or remove people',
    startOver: 'Start over',
    startOverConfirm: 'This clears the family and every logged turn. Start over?',
  },

  close: 'Close',
} as const;

export type Strings = typeof en;
