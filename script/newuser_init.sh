#! /bin/bash
NEWUSER=$1
# useradd -Nms /bin/zsh -g ${CODE_GROUP} ${NEWUSER}
HOME_=$(su ${NEWUSER} --command "echo \${HOME}")
cp ${ZSH_DIR}/.zshrc   ${HOME_}/.zshrc
cp ${ZSH_DIR}/p10k.zsh ${HOME_}/.p10k.zsh
mkdir -p ${HOME_}/.local/share/code-server/User
cp /usr/share/code-server/User/settings.json    ${HOME_}/.local/share/code-server/User/settings.json 
cp /usr/share/code-server/User/keybindings.json ${HOME_}/.local/share/code-server/User/keybindings.json
ln -s /usr/share/code-server/extensions ${HOME_}/.local/share/code-server/extensions
chown -R ${NEWUSER} ${HOME_}
