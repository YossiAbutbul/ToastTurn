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
    idleYou: "You're up — pull the lever down when it's made",
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
    dragHint: 'Drag to change the order · tap a toast to recolour it',
    colourLabel: 'Colour',
    dragLabel: (name: string) => `Reorder ${name}`,
    recolour: (name: string) => `Change the colour for ${name}`,
  },

  welcome: {
    tagline: 'Whose turn is it to make toast this week?',
    start: 'Start a rotation',
    open: 'Open your rotation',
    join: 'Join a rotation',
    signIn: 'Sign in',
    signInFirst: 'Sign in to make a toast yours.',
  },

  member: {
    askTitle: 'Ask to join',
    ask: 'Ask to be let in',
    askBlurb: 'Whoever runs the rotation decides who joins it.',
    pending: 'Waiting to be let in.',
    pendingBlurb: 'You can watch until then. Ask them to check their settings.',
    signedOut: 'Sign in to join this rotation.',
    leverLocked: 'Only people in the rotation can log the toast',
    waiting: 'Waiting to be let in',
    approve: 'Let in',
    approved: (who: string) => `${who} is in.`,
    nobodyWaiting: 'Nobody is waiting.',
  },

  claim: {
    title: 'Which one are you?',
    blurb: 'Asked once. It stays with your account, so any phone you sign in on knows.',
    change: 'Change which one you are',
  },

  join: {
    title: 'Join a rotation',
    blurb: 'Paste the link someone sent you, or type the code from the end of it.',
    label: 'Link or code',
    placeholder: 'abc12345',
    action: 'Join',
    problem: "That doesn't look like a link or a code. Check it and try again.",
    notFound: "There's no rotation with that code. Ask for the link again.",
  },

  signIn: {
    title: 'Sign in',
    blurb: 'So the rotation knows which toast is yours.',
    email: 'Email',
    password: 'Password',
    action: 'Sign in',
    google: 'Continue with Google',
    or: 'or with an email and password',
    working: 'Signing in…',
    open: 'Sign in to run a rotation',
    signedInTitle: 'Your account',
    signedInAs: (email: string) => `Signed in as ${email}.`,
    signOut: 'Sign out',
    problem: {
      credentials: "That email and password don't match. Try again.",
      offline: "Can't reach the sign-in right now. Try when you're back online.",
      other: 'Something went wrong signing in. Try again.',
    },
  },


  install: {
    prompt: 'Keep ToastTurn on your home screen.',
    ios: 'Keep ToastTurn on your home screen: tap Share, then Add to Home Screen.',
    add: 'Add it',
    dismiss: 'Not now',
  },

  profile: {
    signedOut: 'Not signed in. You can still pull the lever.',
    notOwner: 'The account that started this rotation looks after the people and the schedule.',
    youAre: (name: string) => `You are ${name} in this rotation.`,
  },

  settings: {
    title: 'Settings',
    open: 'Settings',
    youSection: 'Account',
    rotationSection: 'The rotation',
    share: 'Copy the link to share',
    shared: 'Link copied',
    guest: 'The phone that started the rotation looks after the people and the schedule.',
    holiday: 'On holiday',
    editPeople: 'Add or remove people',
    startOver: 'Start over',
    startOverConfirm:
      'This clears the family and every logged turn, on every phone that has the link. Start over?',
  },

  close: 'Close',
} as const;

export type Strings = typeof en;
