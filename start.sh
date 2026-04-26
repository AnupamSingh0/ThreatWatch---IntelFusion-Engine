#!/bin/bash
echo "🛡 Starting ThreatWatch..."
pkill -f uvicorn 2>/dev/null
pkill -f vite 2>/dev/null
sleep 2

cd ~/Documents/threatwatch/backend
source venv/bin/activate
uvicorn main:app --reload &
sleep 4

cd ~/Documents/threatwatch/frontend
npm run dev &

echo "✅ ThreatWatch running!"
echo "   Dashboard: http://localhost:5173/dashboard"
echo "   Globe:     http://localhost:5173"
echo "   API Docs:  http://localhost:8000/docs"
wait
