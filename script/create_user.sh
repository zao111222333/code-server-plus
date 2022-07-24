#! /bin/bash
NEWUSER=$1
PASSWORD=$2
SU=$3

useradd -Nms /bin/zsh -g ${CODE_GROUP} ${NEWUSER}
echo "${NEWUSER}:${PASSWORD}" | chpasswd
if [ ${SU} = true ]
then
    echo "${NEWUSER} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
fi
HOME_=$(su ${NEWUSER} --command "echo \${HOME}")
cp ${ZSH_DIR}/.zshrc   ${HOME_}/.zshrc
cp ${ZSH_DIR}/p10k.zsh ${HOME_}/.p10k.zsh
mkdir -p ${HOME_}/.local/share/code-server/User
cp /usr/share/code-server/User/settings.json    ${HOME_}/.local/share/code-server/User/settings.json 
cp /usr/share/code-server/User/keybindings.json ${HOME_}/.local/share/code-server/User/keybindings.json
ln -s /usr/share/code-server/extensions ${HOME_}/.local/share/code-server/extensions
chown -R ${NEWUSER} ${HOME_}
rm -f ${SOCK_DIR}/code-server@${NEWUSER}.sock
echo 'done'
