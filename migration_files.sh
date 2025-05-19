#!/bin/bash
tables=(
  "users"
  "sessions"
  "posts"
  "comments"
  "follow_requests"
  "post_privacy"
  "like_reaction"
  "private_chats"
  "groups"
  "group_users"
  "group_chats"
  "group_events"
  "event_responses"
  "notifications"
)

echo "Creating migrations in ./backend/database/migrations/sqlite"

for t in "${tables[@]}"; do
  echo "- creating $t"
  migrate create -seq -ext sql -dir "./backend/database/migrations/sqlite" "create_${t}_table"
done

echo "Created ${#tables[@]} table migrations"