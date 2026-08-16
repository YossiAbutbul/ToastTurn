/** Every user-facing string. A Hebrew file drops in beside this one later. */
export const en = {
  brand: { first: 'Toast', second: 'Turn' },

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

  swap: {
    title: (name: string) => `Swap with ${name}`,
    turns: (n: number) => `${n} ${n === 1 ? 'turn' : 'turns'}`,
    onHoliday: 'on holiday',
    alone: 'Add someone else to swap with.',

    // Asking, and being asked.
    sentTitle: (name: string) => `Sent to ${name}`,
    sentNote: (name: string) =>
      `${name} will see the ask next time they open ToastTurn, and can take it or leave it.`,
    sentClose: 'Right you are',
    askTitle: (name: string) => `${name} would like you to take the toast`,
    askNote: (date: string) => `It falls on ${date}.`,
    accept: 'I will take it',
    decline: 'Not this week',
    declined: (name: string) => `${name} can't this week`,
    accepted: (name: string) => `${name} is taking it`,
    waiting: 'Waiting for the rotation to catch up',
    // Someone the owner typed in, who has never opened the app.
    noAccount: (name: string) => `${name} has no account yet, so only you can move the turn`,
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
    title: 'Start a rotation',
    yourName: 'Your name',
    yourNameHint: 'Everyone else asks to join, or you add them later from settings.',
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
    signInFirst: 'Sign in to make a toast yours.',
  },

  member: {
    askTitle: 'Ask to join',
    ask: 'Ask to be let in',
    askBlurb: 'Whoever runs the rotation adds you to it when they let you in.',
    yourName: 'Your name',
    joinAs: 'Tell them your name',
    pending: 'Waiting to be let in.',
    pendingBlurb: 'You can watch until then. Ask them to check their settings.',
    signedOut: 'Sign in to join this rotation.',
    leverLocked: 'Only people in the rotation can log the toast',
    waiting: 'Waiting to be let in',
    approve: 'Let in',
    waitingUnnamed: 'Someone',
    approved: (who: string) => `${who} is in.`,
    nobodyWaiting: 'Nobody is waiting.',

    askAction: 'Ask to be let in',
    waitTitle: 'Waiting to be let in',
    waitBlurb: 'Whoever runs it has your name. The toast turns up here the moment they let you in.',
    nudgeHint: 'Been a while? Give them a nudge.',
    nudge: 'Remind them',
    nudgeSent: 'Reminder sent',
    nudgeBlurb: "They'll see it the next time they open the app.",
    notYou: 'Sign out',
  },

  invite: {
    kicker: "You've been invited to",
    unnamed: 'a toast rotation',
    blurb: 'Sign in first, then whoever runs the rotation can let you in.',
    action: 'Sign in to join',
    notNow: 'Not now',
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
      setup: "This copy of the app has no sign-in set up. If you're running it yourself, restart it after adding the keys.",
      other: 'Something went wrong signing in. Try again.',
    },
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
    open: 'Orders',
    orderNow: 'Order now',
    trayEmpty: 'Nobody has said what they want',
    trayYours: (n: number) => `You're making ${n}`,
    trayOthers: (n: number) => `${n} on the list`,
    yours: 'Yours',
    everyone: 'The whole list',
    sliceNo: (n: number) => `Slice ${n}`,
    dropSlice: (n: number) => `Take slice ${n} off`,
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
  },

  close: 'Close',
} as const;

export type Strings = typeof en;
