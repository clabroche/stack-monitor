const dotenv = require('dotenv');
const cp = require('child_process');

dotenv.config();
const [cmd, ...cmdArgs] = process.argv.slice(2).join(' ').split(' ');
try {
  const {
    status, stderr, stdout, error,
  } = cp.spawnSync(cmd, cmdArgs, { stdio: 'inherit', env: { ...process.env } });
  if (status !== 0) {
    console.error(stderr || error || stdout);
    process.exit(1);
  }
} catch (error) {
  console.log(cmd, cmdArgs);
  console.error(error);
  process.exit(1);
}
