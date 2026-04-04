#!/bin/bash
echo "Installing git-subrepo locally for Linux/Mac/Git Bash..."

if [ ! -d ".git-subrepo" ]; then
    git clone https://github.com/ingydotnet/git-subrepo .git-subrepo
else
    echo ".git-subrepo already exists, skipping clone."
fi

# Determine shell config
RC_FILE=""
if [ -n "$ZSH_VERSION" ] || [ -f ~/.zshrc ]; then
    RC_FILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f ~/.bashrc ]; then
    RC_FILE="$HOME/.bashrc"
else
    RC_FILE="$HOME/.profile"
fi

# Add to path if not already there
SUBREPO_PATH="$PWD/.git-subrepo/lib"
if ! grep -q "$SUBREPO_PATH" "$RC_FILE"; then
    echo "" >> "$RC_FILE"
    echo "# agrihub-git-subrepo" >> "$RC_FILE"
    echo "export PATH=\"$SUBREPO_PATH:\$PATH\"" >> "$RC_FILE"
    echo "Added git-subrepo to $RC_FILE"
else
    echo "git-subrepo path already exists in $RC_FILE"
fi

echo ""
echo "========================================================="
echo "Done! "
echo "IMPORTANT: Please run 'source $RC_FILE' or restart your terminal"
echo "so that you can start using 'git subrepo'."
echo "========================================================="
