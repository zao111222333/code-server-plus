function disconnect(socketPath){
  const command = `rm -rf ${socketPath}`;
  return command
}