#!/bin/zsh

PROJECT_DIR="${0:A:h}"
cd "$PROJECT_DIR" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is not available. Install Node.js and try again."
  read -r "?Press Enter to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Preparing the project for the first time…"
  npm install || exit 1
fi

echo "Starting Media Multiviewer…"
npm run dev &
SERVER_PID=$!

finish() {
  kill "$SERVER_PID" >/dev/null 2>&1
}
trap finish EXIT INT TERM

for attempt in {1..30}; do
  if curl --silent --fail http://localhost:3000/ >/dev/null 2>&1; then
    if open -a "Google Chrome" http://localhost:3000/ 2>/dev/null; then
      echo "Media Multiviewer opened in Google Chrome."
    else
      open http://localhost:3000/
      echo "Media Multiviewer opened in your default browser."
    fi
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 1
done

echo "Media Multiviewer could not open. Check the messages above."
wait "$SERVER_PID"
