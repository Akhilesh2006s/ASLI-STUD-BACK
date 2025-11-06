import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testAdminAPI() {
  console.log('🧪 Testing Admin API Endpoints...\n');
  
  try {
    // Test 1: Get all admins
    console.log('1️⃣ Testing GET /api/super-admin/admins');
    const response = await axios.get(`${BASE_URL}/api/super-admin/admins`);
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`\n📋 Found ${response.data.data.length} admins:`);
      response.data.data.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name || 'Unknown'} (${admin.email || 'No email'})`);
        console.log(`      - ID: ${admin.id}`);
        console.log(`      - Students: ${admin.totalStudents}`);
        console.log(`      - Teachers: ${admin.totalTeachers}`);
        console.log(`      - Status: ${admin.status}`);
        console.log(`      - Created: ${admin.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error.response?.data || error.message);
  }
  
  try {
    // Test 2: Create a test admin
    console.log('\n2️⃣ Testing POST /api/super-admin/admins');
    const newAdmin = {
      name: 'Test Admin API',
      email: 'testadmin@example.com',
      password: 'testpassword123'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/super-admin/admins`, newAdmin);
    console.log('✅ Admin Created:', createResponse.data);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.response?.data || error.message);
  }
  
  try {
    // Test 3: Get admins again to see the new one
    console.log('\n3️⃣ Testing GET /api/super-admin/admins (after creation)');
    const response2 = await axios.get(`${BASE_URL}/api/super-admin/admins`);
    
    if (response2.data.success && response2.data.data) {
      console.log(`📊 Now found ${response2.data.data.length} admins:`);
      response2.data.data.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching admins after creation:', error.response?.data || error.message);
  }
}

// Run the test
testAdminAPI().catch(console.error);







