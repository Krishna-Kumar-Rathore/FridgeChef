// One place that decides what the user sees for each failure code.
// `kind: 'empty'` renders as a gentle empty state, `'error'` as an error card.
// `retry` = a plain retry makes sense; `edit` = changing the input is the fix.

export const ERROR_COPY = {
  NOT_FOOD: {
    kind: 'empty',
    title: "We couldn't find ingredients in that",
    body: 'List a few things you have, separated by commas — for example “rice, eggs, frozen peas, soy sauce”.',
    retry: false,
    edit: true,
  },
  EMPTY: {
    kind: 'empty',
    title: 'The AI came back empty-handed',
    body: 'It returned no ingredients or steps. Trying again usually works; adding one or two more ingredients helps too.',
    retry: true,
    edit: true,
  },
  BAD_OUTPUT: {
    kind: 'error',
    title: 'The recipe came back garbled',
    body: "The AI's answer wasn't in a shape the app can use, even after we asked it to fix it. Try again.",
    retry: true,
    edit: false,
  },
  TIMEOUT: {
    kind: 'error',
    title: 'The AI is taking too long',
    body: 'No answer after a while, so we stopped waiting. Try again — shorter ingredient lists are faster.',
    retry: true,
    edit: false,
  },
  RATE_LIMITED: {
    kind: 'error',
    title: 'Too many requests right now',
    body: 'The free AI tier is busy. Wait about 10 seconds, then try again.',
    retry: true,
    edit: false,
  },
  NETWORK: {
    kind: 'error',
    title: "Can't reach the server",
    body: 'Check your internet connection, then try again.',
    retry: true,
    edit: false,
  },
  INVALID_INPUT: {
    kind: 'error',
    title: 'Check your ingredient list',
    body: null, // server message is specific enough
    retry: false,
    edit: true,
  },
  CONFIG: {
    kind: 'error',
    title: "The server isn't set up yet",
    body: null,
    retry: true,
    edit: false,
  },
  SERVER: {
    kind: 'error',
    title: 'Something went wrong on our side',
    body: 'The server hit an error making your recipe. Try again.',
    retry: true,
    edit: false,
  },
};

export function describeError(error) {
  const copy = ERROR_COPY[error?.code] ?? ERROR_COPY.SERVER;
  return { ...copy, body: copy.body ?? error?.message ?? ERROR_COPY.SERVER.body };
}
