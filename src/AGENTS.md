# AGENTS.md

You are working on a full-stack real-time multiplayer chess application.

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- Realtime: Socket.IO
- Database: MongoDB

---

## CORE PRINCIPLE
Backend + MongoDB is the ONLY source of truth.
Frontend is only a renderer and event sender.

Frontend must NEVER:
- validate chess moves
- decide turn logic
- determine game outcome
- mutate game state directly

---

## ARCHITECTURE FLOW (STRICT)
All game actions must follow this flow:

Client → Socket event → Backend validation → MongoDB update → Socket broadcast → Frontend render

---

## SOCKET EVENTS (DO NOT CHANGE)
- join_game
- game_state
- make_move
- move_made
- game_over
- disconnect

---

## GAME RULES (BACKEND RESPONSIBILITY ONLY)
Backend must handle:
- move validation
- turn enforcement
- check / checkmate detection
- draw conditions
- game state updates
- persistence to MongoDB

---

## DATABASE RULES
Each game document must contain:
- gameId
- players (white/black)
- boardState
- moveHistory
- currentTurn
- status (active | checkmate | draw | abandoned)
- timestamps

All valid moves must be persisted immediately.

---

## RECONNECT RULE
If a player disconnects:
- game state must remain in MongoDB
- game must NOT reset

On reconnect:
- backend restores full game state
- frontend requests latest `game_state`

---

## SOCKET RULES
- No duplicate socket connections per user
- No multiple rooms per gameId
- No direct frontend state authority
- All updates must be confirmed by backend before broadcast

---

## SAFETY RULE FOR AGENTS
- Do NOT rewrite the project structure
- Do NOT rename socket events
- Do NOT remove existing features
- Make minimal, surgical changes only
- Preserve compatibility with current frontend and backend

---

## OUTPUT RULE
When modifying code:
Return only:
- code fixes
- improved socket handlers
- backend logic improvements
- MongoDB model updates if necessary

Do NOT refactor unrelated parts of the codebase.