/** Every user-facing string. One file, so no copy is stranded in a component. */
export const en = {
  brand: {
    home: 'ToastTurn, back to the start',
    first: 'Toast',
    second: 'Turn',
  },

  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  home: {
    kicker: "This week it's",
    /** Once this week's toast is made, the name on the screen is next week's. */
    nextUp: 'Next up',
    dueOn: (day: string) => `Toast is on ${day}`,
    history: 'History',
    turnsSoFar: (turns: number, last: string) =>
      `${turns} ${turns === 1 ? 'turn' : 'turns'} so far · last made ${last}`,
    firstTurn: 'First turn on the board',
    nobodyYet: "No one's in the rotation yet. Add the first person.",
    addPeople: 'Add people',
    upNow: (name: string) => `${name} is up`,
    /** Same place in the queue, but nobody is on the hook until the next one. */
    upNext: (name: string) => `${name} is next`,
  },

  lever: {
    label: "Pull the lever down to log this week's toast",
    idle: 'Pull the lever down when the toast is made',
    idleYou: "You're up. Pull the lever down when it's made",
    pulling: 'Keep pulling…',
    ready: 'Let go!',
    toasting: 'Toasting…',
    logged: (next: string, day: string) => `Logged. Next ${day} is on ${next}.`,
    loggedAlone: 'Logged.',
    done: (name: string) => `${name} did it! 🎉`,
  },

  history: {
    title: 'History',
    tabCalendar: 'Calendar',
    tabList: 'Every turn',
    thisMonth: 'This month',
    everyTurn: 'Every turn',
    noneThisMonth: 'No toast this month yet.',
    rate: (name: string) => `Rate the toast ${name} made`,
    empty: 'No toast yet. Pull the lever when someone makes it.',
    notRated: 'not rated yet',
    skipped: 'Okay, next time 👍',
    skippedRow: 'nobody made it',
    skippedHint: "Noted. Nobody's turn moved.",
    logSkip: 'Nobody made it this week',
  },

  schedule: {
    title: 'Toast night',
    day: 'Day',
    time: 'Time',
    am: 'AM',
    pm: 'PM',
    hourUp: 'An hour later',
    hourDown: 'An hour earlier',
    minuteUp: 'Fifteen minutes later',
    minuteDown: 'Fifteen minutes earlier',
    flipHalf: 'Morning or evening',
    remind: 'Remind everyone that morning',
  },

  setup: {
    back: 'Back',
    title: 'Start a rotation',
    yourName: 'Your name',
    yourNameHint: 'Everyone else opens the link and taps their own name.',
    familyLabel: 'Family name',
    familyPlaceholder: 'The Abutbuls',
    peopleLabel: 'Who makes toast',
    namePlaceholder: 'Name',
    add: 'Add',
    remove: (name: string) => `Remove ${name}`,
    moveUp: (name: string) => `Move ${name} earlier`,
    moveDown: (name: string) => `Move ${name} later`,
    empty: "No one's in the rotation yet. Add the first person.",
    start: 'Start the rotation',
    save: 'Done',
    cancel: 'Not now',
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
    signInFirst: 'Starting a rotation needs a Google account. Joining one does not.',
  },

  member: {
    yourName: 'Your name',
    leverLocked: 'Only people in the rotation can log the toast',
  },

  claim: {
    title: 'Who are you?',
    blurb: 'Tap your name and this phone is yours.',
    taken: 'on another phone',
    notListed: "I'm not on the list",
    newTitle: 'Put yourself in',
    newBlurb: 'You go to the end of the rotation, after everyone already in it.',
    newAction: 'Join the rotation',
    backToList: 'Back to the list',
  },

  invite: {
    unnamed: 'a toast rotation',
  },

  day: {
    nothing: 'Nothing logged on this day.',
    nobody: 'Nobody made it',
    skipped: 'The turn stayed where it was.',
    howWasIt: (name: string) => `How was the toast ${name} made?`,
    yours: 'Your rating',
    yoursEmpty: 'tap to rate',
    others: 'Everyone else',
    othersLabel: (name: string) => `What everyone else made of the toast ${name} made`,
    othersEmpty: 'nobody else yet',
    fillIn: 'Forgot to log it? Say who made it:',
    made: (name: string) => `${name} made it`,
    notYet: 'That day has not happened yet.',
    remove: 'Take this turn off the board',
    removeAsk: (name: string) => `Take ${name}'s turn off the board?`,
    removeNote: 'Whoever was up before it goes back to being up.',
    removeYes: 'Take it off',
    removeNo: 'Keep it',
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
    blurb: 'Only whoever runs a rotation needs this. Everyone else just opens the link.',
    google: 'Continue with Google',
    working: 'Signing in…',
    open: 'Sign in to run a rotation',
    signedInTitle: 'Your account',
    signedInAs: (email: string) => `Signed in as ${email}.`,
    signOut: 'Sign out',
    problem: {
      cancelled: '',
      blocked: 'Your browser stopped the Google window opening. Allow pop-ups for this site and try again.',
      domain: 'This address is not one the sign-in will answer to. Add it to the sign-in settings and try again.',
      offline: "Can't reach the sign-in right now. Try when you're back online.",
      setup: 'The sign-in is switched off for this app. Turn the provider on in the console, then try again.',
      other: 'Something went wrong signing in. Try again, and check the console for what.',
    },
    /** No account at all: nothing can be read or written until there is one. */
    noAccount: (why: string) => `This phone hasn't got an account yet, so the rotation can't load. ${why}`,
  },

  update: {
    /** Follows the app's own name, which is set in brand type. */
    ready: 'has a new version.',
    action: 'Get it',
  },

  install: {
    prompt: 'Keep ToastTurn on your home screen.',
    ios: 'Keep ToastTurn on your home screen: tap Share, then Add to Home Screen.',
    add: 'Add it',
    dismiss: 'Not now',
  },

  color: {
    title: 'Your colour',
    custom: 'Mix your own',
    hue: 'Colour',
    shade: 'Shade',
    theirs: (name: string) => `${name}'s colour`,
  },

  orders: {
    title: 'What everyone wants',
    open: 'What everyone wants',
    orderNow: 'Order now',
    trayYours: (n: number) => `You're making ${n}`,
    wants: (name: string, n: number) => `${name} wants ${n} ${n === 1 ? 'slice' : 'slices'}`,
    yours: 'Yours',
    theirs: (name: string) => `For ${name}`,
    whose: 'Whose order',
    everyone: 'The whole list',
    sliceNo: (n: number) => `Slice ${n}`,
    dropSlice: (n: number) => `Take slice ${n} off`,
    dropOrder: (name: string) => `Nothing for ${name} today`,
    startMine: 'Make me one toast',
    startTheirs: (name: string) => `Make ${name} one toast`,
    noneYet: (name: string) => `${name} wants nothing today.`,
    done: (slice: string) => `${slice} is made`,
    notDoneYet: (slice: string) => `${slice}: not made yet`,
    addSlice: 'Add another slice',
    slices: (n: number) => `${n} ${n === 1 ? 'slice' : 'slices'}`,
    onTop: 'On top',
    toppings: {
      cheese: 'Cheese',
      bulgarian: 'Bulgarian cheese',
      tomatoes: 'Tomatoes',
      olives: 'Olives',
      ketchup: 'Ketchup',
      sriracha: 'Sriracha',
    },
    plainSlice: 'plain',
    /** Tapping anyone in the queue along the bottom opens what they want. */
    openTheirs: (name: string) => `What ${name} wants`,
    noteLabel: 'Anything else',
    notePlaceholder: 'Anything else you want on it?',
    nothingYet: "Hasn't said yet",
    said: (said: number, people: number, slices: number) =>
      said === 0
        ? 'Nobody has said yet.'
        : `${said} of ${people} have said, ${slices} ${slices === 1 ? 'slice' : 'slices'} in all.`,
    /** What to get out of the fridge, counted up. */
    fridge: (parts: string[]) => parts.join(' · '),
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
    codeBlurb: 'Read it out and they can type it into Join a rotation.',
    orLink: 'Or send the link, which opens straight into the rotation.',
    copyCode: 'Copy the code',
    codeCopied: 'Code copied',
    guest: 'The phone that started the rotation looks after the people and the schedule.',
    holiday: 'On holiday',
    rotationsSection: 'Your rotations',
    openRotation: 'Open',
    openNow: 'Open now',
    newRotation: 'Start another rotation',
    editPeople: 'Add or remove people',
    startOver: 'Start over',
    startOverAsk: (family: string) => `Clear ${family} and start over?`,
    startOverNote:
      'Everyone in the rotation goes, and so does every turn ever logged, on every phone that has the link. There is no getting it back.',
    startOverYes: 'Clear it all',
    startOverNo: 'Keep the rotation',

    handOver: 'Who looks after it',
    handOverNote: 'Hand the rotation to someone else. You keep your turn in it.',
    handOverNobody: 'Nobody else has been let in yet, so there is nobody to hand it to.',
    handOverPick: (name: string) => `Hand the rotation to ${name}`,
    handOverAsk: (name: string) => `Let ${name} look after the rotation?`,
    handOverAskNote: (name: string) =>
      `${name} decides the people, the toast night and the order from then on. You stay in the rotation and can still pull the lever, but only ${name} can hand it back.`,
    handOverYes: 'Hand it over',
    handOverNo: 'Keep looking after it',
    handedOver: (name: string) => `${name} looks after it now`,
  },

  close: 'Close',
} as const;

export type Strings = typeof en;
