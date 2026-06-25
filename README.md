# Tournament Bracket

A lightweight JavaScript library for rendering and managing single-elimination tournament brackets in the browser.

It supports both classic browser usage with a `<script>` tag and modern ESM usage with `import`. The library renders bracket rounds, matches, players, scores, avatars, and SVG connector lines, while also exposing a small API for updating matches, finishing matches, reading state, and handling events.

---

## Features

- Render single-elimination tournament brackets
- Use with a normal browser `<script>` tag
- Use with modern ESM `import`
- Support player names, scores, avatars, and fallback avatars
- Automatically normalize missing player data
- Validate bracket structure before rendering
- Update match data after initialization
- Set individual player scores
- Finish matches and propagate winners
- Listen to match click, update, and finish events
- Ship separate JavaScript and CSS builds
- Include both minified and non-minified output files

---

## Demo

Try the live demo:

[https://amirhossein-shk.github.io/tournament-bracket/demo/](https://amirhossein-shk.github.io/tournament-bracket/demo/)

---

## File Structure

Recommended project structure:

```txt
project/
  src/
    tournament-bracket.js
    tournament-bracket.scss
    entry-browser.js

  dist/
    tournament-bracket.js
    tournament-bracket.min.js
    tournament-bracket.esm.js
    tournament-bracket.esm.min.js
    tournament-bracket.css
    tournament-bracket.min.css

  demo/
    index.html
    demo.js
    demo.css

  README.md
  package.json
  vite.config.js
```

### Folder Purpose

| Folder | Purpose |
|---|---|
| `src/` | Source code of the library |
| `dist/` | Final build output for users |
| `demo/` | Live demo and usage reference |

---

## Build Files

The `dist` folder contains the final files that users should consume.

```txt
dist/
  tournament-bracket.js
  tournament-bracket.min.js
  tournament-bracket.esm.js
  tournament-bracket.esm.min.js
  tournament-bracket.css
  tournament-bracket.min.css
```

### JavaScript Files

| File | Usage |
|---|---|
| `tournament-bracket.js` | Browser build, non-minified |
| `tournament-bracket.min.js` | Browser build, minified |
| `tournament-bracket.esm.js` | ESM build, non-minified |
| `tournament-bracket.esm.min.js` | ESM build, minified |

### CSS Files

| File | Usage |
|---|---|
| `tournament-bracket.css` | Stylesheet, non-minified |
| `tournament-bracket.min.css` | Stylesheet, minified |

The CSS is intentionally shipped separately from JavaScript. This makes styling easier to override, easier to debug, and easier to use with bundlers or CDNs.

---

## Browser Usage

Use this option when you want to include the library directly in an HTML page.

```html
<link rel="stylesheet" href="./dist/tournament-bracket.min.css" />
<script src="./dist/tournament-bracket.min.js"></script>
```

After loading the browser build, the global function is available as:

```js
tournamentBracket(...)
```

### Complete Browser Example

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tournament Bracket</title>
  <link rel="stylesheet" href="./dist/tournament-bracket.min.css" />
</head>
<body>
  <div id="tournament-bracket"></div>

  <script src="./dist/tournament-bracket.min.js"></script>
  <script>
    const tb = tournamentBracket({
      targetId: "tournament-bracket",
      rounds: [
        {
          roundId: "r1",
          name: "Quarter Finals",
          matches: [
            {
              matchId: "m1",
              isFinished: true,
              players: [
                { name: "Player 1", score: 2, avatarUrl: "" },
                { name: "Player 2", score: 1, avatarUrl: "" }
              ]
            },
            {
              matchId: "m2",
              players: [
                { name: "Player 3", score: "-" },
                { name: "Player 4", score: "-" }
              ]
            }
          ]
        },
        {
          roundId: "r2",
          name: "Semi Finals",
          matches: [
            {
              matchId: "m3",
              players: [{}, {}]
            }
          ]
        }
      ]
    });

    tb.init();
  </script>
</body>
</html>
```

---

## ESM Usage

Use this option when working with a module-based setup.

```js
import tournamentBracket from "./dist/tournament-bracket.esm.js";
import "./dist/tournament-bracket.css";
```

### Complete ESM Example

```js
import tournamentBracket from "./dist/tournament-bracket.esm.js";
import "./dist/tournament-bracket.css";

const tb = tournamentBracket({
  targetId: "tournament-bracket",
  rounds: [
    {
      roundId: "r1",
      name: "Quarter Finals",
      matches: [
        {
          matchId: "m1",
          isFinished: true,
          players: [
            { name: "Player 1", score: 2, avatarUrl: "" },
            { name: "Player 2", score: 1, avatarUrl: "" }
          ]
        },
        {
          matchId: "m2",
          players: [
            { name: "Player 3", score: "-" },
            { name: "Player 4", score: "-" }
          ]
        }
      ]
    },
    {
      roundId: "r2",
      name: "Semi Finals",
      matches: [
        {
          matchId: "m3",
          players: [{}, {}]
        }
      ]
    }
  ]
});

tb.init();
```

If you use ESM directly in the browser, load your code with:

```html
<script type="module" src="./your-file.js"></script>
```

Do not open ESM files directly with `file://`. Use a local development server instead.

---

## Required HTML

The page must contain a target container element:

```html
<div id="tournament-bracket"></div>
```

The `targetId` option must match this element ID:

```js
const tb = tournamentBracket({
  targetId: "tournament-bracket",
  rounds: []
});
```

---

## Configuration

Create a bracket instance by calling:

```js
const tb = tournamentBracket(config);
```

### Available Options

| Option | Type | Default | Description |
|---|---|---:|---|
| `targetId` | `string` | `"tournament-bracket"` | ID of the container element |
| `rounds` | `Array` | required | Tournament rounds data |
| `distance` | `number` | `42` | Internal spacing used for layout and connectors |
| `width` | `number` | `196` | Width of each match card |
| `matchHeight` | `number` | `94` | Height of each match card |
| `roundGap` | `number` | `96` | Horizontal gap between rounds |
| `avatarFallbackUrl` | `string` | `"./images/avatar.png"` | Fallback avatar when a player avatar is missing |
| `connectorColor` | `string` | `"white"` | Color of SVG connector lines |
| `onMatchClick` | `function` | noop | Called when a match is clicked |
| `onMatchUpdate` | `function` | noop | Called when a match is updated |
| `onMatchFinish` | `function` | noop | Called when a match is finished |

---

## Full Configuration Example

```js
const sampleConfig = {
  targetId: "tournament-bracket",
  distance: 80,
  width: 196,
  matchHeight: 72,
  roundGap: 80,
  connectorColor: "#64748b",
  rounds: [
    {
      roundId: "r1",
      name: "Quarter Finals",
      matches: [
        {
          matchId: "m1",
          isFinished: true,
          players: [
            {
              name: "Player 1",
              score: 2,
              avatarUrl: ""
            },
            {
              name: "Player 2",
              score: 1,
              avatarUrl: ""
            }
          ]
        },
        {
          matchId: "m2",
          players: [
            {
              name: "Player 3",
              score: "-"
            },
            {
              name: "Player 4",
              score: "-"
            }
          ]
        }
      ]
    },
    {
      roundId: "r2",
      name: "Semi Finals",
      matches: [
        {
          matchId: "m3",
          players: [{}, {}]
        }
      ]
    }
  ]
};
```

---

## Data Structure

### Rounds

The `rounds` array defines the complete tournament structure.

```js
rounds: [
  {
    roundId: "r1",
    name: "Quarter Finals",
    matches: [
      {
        matchId: "m1",
        players: [
          { name: "Player 1", score: 2 },
          { name: "Player 2", score: 1 }
        ]
      }
    ]
  }
]
```

### Round Object

| Field | Type | Required | Description |
|---|---|---|---|
| `roundId` | `string` | no | Optional custom round ID |
| `name` | `string` | no | Optional round name |
| `matches` | `Array` | yes | List of matches in this round |

### Match Object

| Field | Type | Required | Description |
|---|---|---|---|
| `matchId` | `string` | no | Optional custom match ID |
| `isFinished` | `boolean` | no | Marks the match as completed |
| `players` | `Array` | yes | Exactly two players |

### Player Object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | no | Player display name |
| `score` | `number \| string` | no | Player score, or `"-"` for pending score |
| `avatarUrl` | `string` | no | Player avatar URL |

---

## Default Player Values

If a player is missing or partially defined, the library fills missing fields with default values.

```js
{
  name: "-",
  avatarUrl: "",
  score: "-"
}
```

This is valid:

```js
players: [{}, {}]
```

This is also valid:

```js
players: [
  { name: "Player 1" },
  {}
]
```

Empty player objects are useful for future rounds where participants are not known yet.

---

## Validation Rules

The library validates the tournament structure before rendering.

The rules are:

- `rounds` must be a non-empty array
- every round must be an object
- every round must contain a `matches` array
- every match must be an object
- every match must contain exactly `2` players
- the first round match count must be a power of two
- each next round must contain exactly half the matches of the previous round
- the final round must contain exactly `1` match

### Valid Bracket Shape

```txt
Round 1: 8 matches
Round 2: 4 matches
Round 3: 2 matches
Round 4: 1 match
```

### Invalid Bracket Shape

```txt
Round 1: 3 matches
Round 2: 2 matches
Round 3: 1 match
```

This is invalid because the first round has `3` matches, and `3` is not a power of two.

Tournament math is strict. Sadly, it does not accept emotional arguments.

---

## Instance API

`tournamentBracket(config)` returns an object with these methods:

```js
{
  init,
  updateMatch,
  setMatchScore,
  finishMatch,
  destroy,
  getState,
  onMatchClick,
  onMatchUpdate,
  onMatchFinish
}
```

---

## Methods

### `init()`

Initializes and renders the bracket.

```js
tb.init();
```

Call this after creating the instance.

---

### `updateMatch(matchId, patch)`

Updates an existing match by ID.

```js
tb.updateMatch("m2", {
  players: [
    { name: "Player 3", score: 1 },
    { name: "Player 4", score: 2 }
  ]
});
```

Use this when you want to update match data after initialization.

---

### `setMatchScore(matchId, playerIndex, score)`

Updates the score of one player in a match.

```js
tb.setMatchScore("m2", 0, 3);
tb.setMatchScore("m2", 1, 1);
```

Arguments:

| Argument | Description |
|---|---|
| `matchId` | ID of the match |
| `playerIndex` | Player index, either `0` or `1` |
| `score` | New player score |

---

### `finishMatch(matchId)`

Marks a match as finished.

```js
tb.finishMatch("m2");
```

When a match is finished, the library can resolve the winner and move the winner forward according to the bracket structure.

---

### `destroy()`

Clears the rendered bracket from the target container.

```js
tb.destroy();
```

Use this when you want to remove the bracket or re-render from scratch.

---

### `getState()`

Returns the current internal bracket state.

```js
const state = tb.getState();
console.log(state);
```

This is useful for debugging, inspection, or syncing with external application state.

---

## Event Callbacks

Callbacks can be passed in the initial configuration.

```js
const tb = tournamentBracket({
  ...sampleConfig,
  onMatchClick: function (match) {
    console.log("clicked", match);
  },
  onMatchUpdate: function (match) {
    console.log("updated", match);
  },
  onMatchFinish: function (match) {
    console.log("finished", match);
  }
});
```

They can also be registered or replaced later using the instance API.

---

### `onMatchClick(fn)`

Registers a callback for match click events.

```js
tb.onMatchClick(function (match) {
  console.log("clicked", match);
});
```

---

### `onMatchUpdate(fn)`

Registers a callback for match update events.

```js
tb.onMatchUpdate(function (match) {
  console.log("updated", match);
});
```

---

### `onMatchFinish(fn)`

Registers a callback for match finish events.

```js
tb.onMatchFinish(function (match) {
  console.log("finished", match);
});
```

---

## Complete Event Example

```js
const tb = tournamentBracket({
  ...sampleConfig,
  onMatchClick: function (match) {
    console.log("config.onMatchClick", {
      matchId: match.matchId,
      players: match.players
    });
  },
  onMatchUpdate: function (match) {
    console.log("config.onMatchUpdate", {
      matchId: match.matchId,
      players: match.players,
      isFinished: match.isFinished
    });
  },
  onMatchFinish: function (match) {
    console.log("config.onMatchFinish", {
      matchId: match.matchId,
      players: match.players
    });
  }
});

tb.init();
```

---

## Typical Usage Flow

A common usage flow looks like this:

```js
const tb = tournamentBracket(sampleConfig);

tb.init();

tb.setMatchScore("m2", 0, 2);
tb.setMatchScore("m2", 1, 0);

tb.finishMatch("m2");

console.log(tb.getState());
```

---

## Demo

The `demo/` folder can contain a live example of the library.

Recommended demo structure:

```txt
demo/
  index.html
  demo.js
  demo.css
```

The demo should show both:

- the rendered tournament bracket
- the code used to create it

This way, users can see how the library works and copy the usage code from the same place.

---

## Styling

The library requires CSS for proper visual presentation.

### Browser Usage

```html
<link rel="stylesheet" href="./dist/tournament-bracket.min.css" />
<script src="./dist/tournament-bracket.min.js"></script>
```

### ESM Usage

```js
import "./dist/tournament-bracket.css";
import tournamentBracket from "./dist/tournament-bracket.esm.js";
```

If the JavaScript works but the bracket looks broken or unstyled, the CSS file is probably missing.

Without CSS, the bracket technically works, but visually it may look like it lost a fight with a spreadsheet.

---

## Troubleshooting

### The bracket does not render

Check that the target container exists:

```html
<div id="tournament-bracket"></div>
```

Also check that the `targetId` matches:

```js
targetId: "tournament-bracket"
```

---

### The browser says `tournamentBracket is not defined`

Make sure the browser build is loaded before your script:

```html
<script src="./dist/tournament-bracket.min.js"></script>
<script>
  const tb = tournamentBracket(config);
</script>
```

---

### ESM import does not work

Make sure you are using the ESM build:

```js
import tournamentBracket from "./dist/tournament-bracket.esm.js";
```

If you are testing directly in the browser, use a local server and a module script:

```html
<script type="module" src="./demo.js"></script>
```

Do not rely on `file://` for ESM testing.

---

### Styles are missing

Include the CSS file:

```html
<link rel="stylesheet" href="./dist/tournament-bracket.min.css" />
```

or import it in your module setup:

```js
import "./dist/tournament-bracket.css";
```

---

### Invalid rounds error

Check these structure rules:

- first round match count must be a power of two
- each next round must have half the matches of the previous round
- final round must have exactly one match
- every match must have exactly two players

---

## Links

- [Live Demo](https://amirhossein-shk.github.io/tournament-bracket/demo/)
- [GitHub Repository](https://github.com/amirhossein-shk/tournament-bracket)
- [NPM Package](https://www.npmjs.com/package/@amirhossein-shk/tournament-bracket-js)

---

## License

MIT
