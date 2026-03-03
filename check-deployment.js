import dotenv from 'dotenv';
dotenv.config({ path: '/Users/yw/Dev/code/factoria/configs/.env' });

const accessToken = process.env.VERCEL_ACCESS_TOKEN;

if (!accessToken) {
  console.error('VERCEL_ACCESS_TOKEN not configured');
  process.exit(1);
}

// 从日志中提取部署 ID
const deploymentUrl = process.argv[2]; // factoria-ayga1ov7u-yanwei-xyz.vercel.app
const deploymentId = deploymentUrl.split('-')[1].split('.')[0]; // ayga1ov7u

console.log('Checking deployment:', deploymentUrl);
console.log('Deployment ID:', deploymentId);

fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('Deployment state:', data.readyState);
    console.log('Deployment URL:', data.url);
    console.log('Build status:', data.build?.[0]?.status);
    console.log('Created at:', data.createdAt);
  })
  .catch(err => console.error('Error:', err.message));
