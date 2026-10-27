#!/bin/bash
# === Auto Commit Script for Lupis Engine ===

REPO_PATH="/home/ubuntu/lupis-engine"
cd $REPO_PATH || exit

# File untuk menyimpan jumlah hari commit
COUNTER_FILE="$REPO_PATH/.commit_day_count"

# Jika belum ada, buat file counter dimulai dari 1
if [ ! -f "$COUNTER_FILE" ]; then
    echo 1 > "$COUNTER_FILE"
fi

# Ambil nilai hari ke-n sekarang
DAY=$(cat "$COUNTER_FILE")

# Tambahkan semua perubahan
git add .

# Commit dengan pesan "Day-n Auto Commit"
git commit -m "Day-$DAY Auto Commit"

# Push ke branch utama (ganti 'main' jika pakai branch lain)
git push origin main

# Naikkan counter harinya
NEXT_DAY=$((DAY + 1))
echo $NEXT_DAY > "$COUNTER_FILE"

echo "✅ Day-$DAY Auto Commit completed at $(date)"
