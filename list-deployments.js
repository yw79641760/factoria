import dotenv from 'dotenv';
dotenv.config({ path: '/Users/yw/Dev/code/factoria/configs/.env' });

const accessToken = process.env.VERCEL_ACCESS_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!accessToken || !projectId) {
  console.error('Environment variables not configured');
  process.exit(1);
}

console.log('Getting recent deployments for project:', projectId);

// 获取最近的部署列表
fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('Total deployments:', data.deployments?.length || 0);
    console.log('\nRecent deployments:');
    
    data.deployments?.slice(0, 5).forEach((dep, index) => {
      console.log(`\n${index + 1}. ${dep.name || 'Unnamed'}`);
      console.log(`   URL: ${dep.url}`);
      console.log(`   State: ${dep.readyState}`);
      console.log(`   Created: ${dep.createdAt}`);
      console.log(`   Build status: ${dep.build?.[0]?.status || 'N/A'}`);
    });
  })
  .catch(err => console.error('Error:', err.message));
