import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Test configuration
const testConfig = {
  superAdminCredentials: {
    email: 'Amenity@gmail.com',
    password: 'Amenity'
  },
  adminCredentials: {
    email: 'admin1@test.com',
    password: 'admin123'
  }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Test functions
async function testSuperAdminLogin() {
  console.log('🔐 Testing Super Admin Login...');
  const result = await apiCall('POST', '/api/super-admin/login', testConfig.superAdminCredentials);
  
  if (result.success) {
    console.log('✅ Super Admin login successful');
    return result.data.token;
  } else {
    console.log('❌ Super Admin login failed:', result.error);
    return null;
  }
}

async function testCreateAdmin(superAdminToken) {
  console.log('👤 Testing Admin Creation...');
  const adminData = {
    name: 'Test Admin 1',
    email: 'admin1@test.com',
    password: 'admin123'
  };
  
  const result = await apiCall('POST', '/api/super-admin/admins', adminData, superAdminToken);
  
  if (result.success) {
    console.log('✅ Admin created successfully');
    return result.data.data.id;
  } else {
    console.log('❌ Admin creation failed:', result.error);
    return null;
  }
}

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...');
  const result = await apiCall('POST', '/api/admin/login', testConfig.adminCredentials);
  
  if (result.success) {
    console.log('✅ Admin login successful');
    return result.data.token;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return null;
  }
}

async function testCreateStudent(adminToken) {
  console.log('🎓 Testing Student Creation...');
  const studentData = {
    name: 'Test Student 1',
    email: 'student1@test.com',
    classNumber: '10A',
    phone: '1234567890',
    details: 'Test student details'
  };
  
  const result = await apiCall('POST', '/api/admin/students', studentData, adminToken);
  
  if (result.success) {
    console.log('✅ Student created successfully');
    return result.data.data.id;
  } else {
    console.log('❌ Student creation failed:', result.error);
    return null;
  }
}

async function testCreateTeacher(adminToken) {
  console.log('👨‍🏫 Testing Teacher Creation...');
  const teacherData = {
    name: 'Test Teacher 1',
    email: 'teacher1@test.com',
    phone: '9876543210',
    department: 'Mathematics',
    qualifications: 'M.Sc Mathematics',
    subjects: []
  };
  
  const result = await apiCall('POST', '/api/admin/teachers', teacherData, adminToken);
  
  if (result.success) {
    console.log('✅ Teacher created successfully');
    return result.data.data.id;
  } else {
    console.log('❌ Teacher creation failed:', result.error);
    return null;
  }
}

async function testGetStudents(adminToken) {
  console.log('📚 Testing Get Students...');
  const result = await apiCall('GET', '/api/admin/students', null, adminToken);
  
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.data.length} students`);
    return result.data.data;
  } else {
    console.log('❌ Get students failed:', result.error);
    return [];
  }
}

async function testGetTeachers(adminToken) {
  console.log('👨‍🏫 Testing Get Teachers...');
  const result = await apiCall('GET', '/api/admin/teachers', null, adminToken);
  
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.data.length} teachers`);
    return result.data.data;
  } else {
    console.log('❌ Get teachers failed:', result.error);
    return [];
  }
}

async function testDashboardStats(adminToken) {
  console.log('📊 Testing Dashboard Stats...');
  const result = await apiCall('GET', '/api/admin/dashboard/stats', null, adminToken);
  
  if (result.success) {
    console.log('✅ Dashboard stats retrieved:', result.data.data);
    return result.data.data;
  } else {
    console.log('❌ Dashboard stats failed:', result.error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Multi-Tenant System Tests...\n');
  
  // Test 1: Super Admin Login
  const superAdminToken = await testSuperAdminLogin();
  if (!superAdminToken) {
    console.log('❌ Cannot proceed without super admin access');
    return;
  }
  
  // Test 2: Create Admin
  const adminId = await testCreateAdmin(superAdminToken);
  if (!adminId) {
    console.log('❌ Cannot proceed without admin');
    return;
  }
  
  // Test 3: Admin Login
  const adminToken = await testAdminLogin();
  if (!adminToken) {
    console.log('❌ Cannot proceed without admin token');
    return;
  }
  
  // Test 4: Create Student
  const studentId = await testCreateStudent(adminToken);
  
  // Test 5: Create Teacher
  const teacherId = await testCreateTeacher(adminToken);
  
  // Test 6: Get Students
  const students = await testGetStudents(adminToken);
  
  // Test 7: Get Teachers
  const teachers = await testGetTeachers(adminToken);
  
  // Test 8: Dashboard Stats
  const stats = await testDashboardStats(adminToken);
  
  console.log('\n📋 Test Summary:');
  console.log(`- Admin ID: ${adminId}`);
  console.log(`- Student ID: ${studentId || 'Not created'}`);
  console.log(`- Teacher ID: ${teacherId || 'Not created'}`);
  console.log(`- Students Retrieved: ${students.length}`);
  console.log(`- Teachers Retrieved: ${teachers.length}`);
  console.log(`- Dashboard Stats: ${stats ? 'Retrieved' : 'Failed'}`);
  
  console.log('\n✅ Multi-Tenant System Tests Completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };


