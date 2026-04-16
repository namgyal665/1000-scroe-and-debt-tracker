# Card Debt Tracker

Mobile-first browser app for your card games:

- `Session mode` for multiple games before settling
- `Single game mode` for quick one-off games
- Custom payouts by finishing position
- Exact `1000` winner bonus
- `0` or negative score loser bonus
- Splitwise-style simplified settlement
- History with pending payments you can mark as paid later

## Open it

Open [index.html](/Users/tenzinnamgyal/Documents/New%20project/index.html) in a browser.

## Rules built into the app

- Normal round: all player points must total `360`
- Declaration success: declarer gets `720`, others `0`
- Declaration fail: declarer gets `-360`, their own won points are ignored, and only the points actually won by the other players count
- Winner can be determined by:
  - first player to reach `1000`
  - highest score when you manually finish the game
- Payouts are set before the session by finishing position
- Special money rules:
  - winner on exactly `1000`: each losing player's payment adds their original amount one more time
  - player on `0` or less: that player's payment adds their original amount one more time
  - both together: that player pays triple total, not 4x

## Notes

- Tie handling is manual on purpose: when scores tie, use your side game, then assign the final positions in the finish dialog.
- Data is saved in the browser with `localStorage`.
