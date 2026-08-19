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
    history: 'History',
    turnsSoFar: (turns: number, last: string) =>
      `${turns} ${turns === 1 ? 'turn' : 'turns'} so far · last made ${last}`,
    firstTurn: 'First turn on the board',
    nobodyYet: "No one's in the rotation yet. Add the first person.",
    addPeople: 'Add people',
    upNow: (name: string) => `${name} is up`,
  },

  lever: {
    label: "Pull the lever down to log this week's toast",
    idle: 'Pull the lever down when the toast is made',
    idleYou: "You're up. Pull the lever down when it's made",
    pulling: 'Keep pulling…',
    ready: 'Let go!',
    toasting: 'Toasting…',
    logged: (next: string) => `Logged. ${next} is up next.`,
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

  setup: {
    back: 'Back',
    title: 'Start a rotation',
    yourName: 'Your name',
    yourNameHint: 'Everyone else opens the link and taps their own name.',
    familyLabel: 'Family name',
    familyPlaceholder: 'The Abutbuls',
    namePlaceholder: 'Name',
    moveUp: (name: string) => `Move ${name} earlier`,
    moveDown: (name: string) => `Move ${name} later`,
    empty: "No one's in the rotation yet. Add the first person.",
    start: 'Start the rotation',
    cancel: 'Not now',
    joinInstead: 'Join a rotation instead',
    home: 'Back to the start',
    colourLabel: 'Colour',
  },

  welcome: {
    /** The slice on the front is pressable, and toasts. Nothing depends on it. */
    toastIt: 'Toast it',
    untoastIt: 'Let it cool',
    tagline: 'Whose turn is it to make toast this week?',
    start: 'Start a rotation',
    open: 'Open your rotation',
    join: 'Join a rotation',
    signIn: 'Sign in',
    signInFirst: 'Starting one needs a Google account. Joining does not.',
    /** Said to whoever signed out: their rotation is still theirs to run. */
    signInBack: 'Signed out. Sign in with the same account to run your rotation again.',
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
    backHome: 'Back to the start',
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
    opening: 'Opening',
    openingBlurb: 'Fetching the rotation this code belongs to.',
    backHome: 'Back to the start',
    stopWaiting: 'Not now',
    otherCode: 'Try a different code',
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
    addSlice: 'Add another slice',
    slices: (n: number) => `${n} ${n === 1 ? 'slice' : 'slices'}`,
    bread: 'Made on',
    breads: {
      sliced: 'Sliced bread',
      challah: 'Challah',
      tortilla: 'Tortilla',
      bun: 'Bun',
    },
    breadFor: (bread: string) => `Make it on ${bread.toLowerCase()}`,
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
    /** Made and handed over, which is when the order comes off the board. */
    orderDone: 'Order is done',
    orderDoneAsk: (name: string) => `${name}'s order is done?`,
    orderDoneNote: 'It comes off the board. They can ask for another whenever they like.',
    orderDoneYes: 'It is done',
    /** Said after the fact, with the one step back beside it. */
    orderDoneNote2: (name: string) => `${name}'s order is off the board`,
    undo: 'Undo',
    orderDoneNo: 'Not yet',
    /** Somebody else took yours off the board: it is out of the toaster. */
    readyTitle: 'Your toast is ready',
    readyBy: (name: string) => `${name} has made it.`,
    readyClose: 'On my way',
    clearBoard: "Clear everyone's orders",
    clearBoardAsk: 'Clear the whole board?',
    clearBoardNote:
      'Every order goes, and the ticks with them. Everyone says what they want again next time.',
    clearBoardYes: 'Clear it',
    clearBoardNo: 'Leave it',
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
    title: 'You',
    open: 'You, and your colour',
    signedOut: 'Not signed in. You can still pull the lever.',
    notOwner: 'The account that started this rotation looks after who is in it.',
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
    guest: 'The phone that started the rotation looks after who is in it.',
    holiday: 'On holiday',
    peopleSection: 'Who makes toast',
    /** The way in, from the end of the queue along the bottom. */
    manageRotation: 'Add or arrange who makes toast',
    rotationTitle: 'Who makes toast',
    rotationBlurb: 'The order they come round in. Drag nobody, tap the arrows.',
    renameFamily: 'Change the name',
    renameTitle: 'What is this rotation called?',
    renameLabel: 'Name',
    renameSave: 'Save it',
    renameCancel: 'Leave it',
    removePerson: (name: string) => `Take ${name} out of the rotation`,
    removeAsk: (name: string) => `Take ${name} out of the rotation?`,
    removeNote:
      'The toast they made stays in the history. A phone that said it was them goes back to picking a name.',
    removeYes: 'Take them out',
    removeNo: 'Keep them',
    rotationsSection: 'Your rotations',
    openRotation: 'Open',
    openNow: 'Open now',
    newRotation: 'Start another rotation',
    editRotation: 'Arrange the rotation',
    doneRotation: 'Done arranging',
    addPerson: 'Add someone',
    addPersonName: 'Their name',
    addPersonAction: 'Add',
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
