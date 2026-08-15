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
    emailPlaceholder: 'their email',
    emailFor: (name: string) => `Email for ${name}`,
    emailHint: 'The address each person signs in with — that is how their phone knows them.',
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

  welcome: {
    tagline: 'Whose turn is it to make toast this week?',
    start: 'Start a rotation',
    open: 'Open your rotation',
    join: 'Join a rotation',
    signIn: 'Sign in',
    signInFirst: 'You sign in once, and the app knows which toast is yours on any phone.',
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
    open: 'Sign in to run the family',
    signedInTitle: 'Running the family',
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
    nobody: 'Not in this rotation',
    thisPhone: 'This phone',
    notInRotation: 'Ask whoever runs the rotation to add your email to it.',
    colour: 'Your toast colour',
  },

  settings: {
    title: 'Settings',
    open: 'Settings',
    youSection: 'You',
    rotationSection: 'The rotation',
    share: 'Copy the link for the family',
    shared: 'Link copied',
    guest: 'The phone that started the family looks after the people and the schedule.',
    holiday: 'On holiday',
    editPeople: 'Add or remove people',
    startOver: 'Start over',
    startOverConfirm:
      'This clears the family and every logged turn, on every phone that has the link. Start over?',
  },

  close: 'Close',
} as const;

export type Strings = typeof en;
