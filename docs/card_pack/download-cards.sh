#!/bin/bash

# Download and setup Kenney's Playing Cards Pack
echo "🃏 Downloading Kenney's Playing Cards Pack..."

# Create temporary directory
mkdir -p temp_cards
cd temp_cards || exit

# Download the pack
curl -L "https://kenney.nl/media/pages/assets/playing-cards-pack/08ea695cb6-1677495915/kenney_playing-cards-pack.zip" -o kenney_cards.zip

# Extract the pack
unzip kenney_cards.zip

# Move assets to the correct location
echo "📁 Moving card assets to src/assets/images/cards/"
cp -r */PNG/* ../src/assets/images/cards/

# Clean up
cd ..
rm -rf temp_cards

echo "✅ Card assets downloaded and installed!"
echo "📂 Cards are now in: src/assets/images/cards/"
echo ""
echo "Next steps:"
echo "1. Run the update script: npm run update-cards"
echo "2. Start the game: npm run dev"