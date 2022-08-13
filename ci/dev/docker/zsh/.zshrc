# Source My Config
source ${ZSH_DIR}/config.zsh
# Source global definitions
if [ -f /etc/profile ]; then
	. /etc/profile
fi
if [ -f /etc/zshrc ]; then
	. /etc/zshrc
fi
if [ -f $HOME/.zshenv ]; then
    . $HOME/.zshenv
fi
# Lines configured by zsh-newuser-install
HISTFILE=$HOME/.zshistory
HISTSIZE=1000
SAVEHIST=1000
bindkey -e
# End of lines configured by zsh-newuser-install

# User specific environment
PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export PATH
