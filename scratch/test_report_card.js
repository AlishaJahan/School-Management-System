const http = require('http');

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('--- LOGGING IN USERS ---');
    const tLogin = await post('http://localhost:5000/api/auth/login', {
      email: 'alisha@school.com',
      password: 'teacher123'
    });
    const sLogin = await post('http://localhost:5000/api/auth/login', {
      email: 'rahul@school.com',
      password: 'student123'
    });
    const pLogin = await post('http://localhost:5000/api/auth/login', {
      email: 'parent.sana@school.com',
      password: 'parentpassword'
    });

    if (tLogin.statusCode !== 200 || sLogin.statusCode !== 200 || pLogin.statusCode !== 200) {
      console.error('Logins failed:', { tLogin, sLogin, pLogin });
      return;
    }
    const teacherToken = tLogin.data.token;
    const studentToken = sLogin.data.token;
    const parentToken = pLogin.data.token;
    console.log('All logins successful.');

    console.log('\n--- TESTING REPORT CARD GENERATION (TEACHER VIEW FOR STUDENT 1: RAHUL VERMA) ---');
    // Fetch Rahul (student_id = 1) report card
    const rahulCard = await get('http://localhost:5000/api/insights/report-card/1', {
      'Authorization': `Bearer ${teacherToken}`
    });
    console.log('Status Code:', rahulCard.statusCode);
    console.log('Student Name:', rahulCard.data.studentName);
    console.log('Roll Number:', rahulCard.data.rollNo);
    console.log('Class Grade:', rahulCard.data.classGrade);
    console.log('Overall Average Grade:', rahulCard.data.metrics.avgMarks + '%');
    console.log('Attendance Rate:', rahulCard.data.metrics.attendanceRate + '%');
    console.log('Subject Averages:', JSON.stringify(reportAveragesBrief(rahulCard.data.subjectAverages)));
    console.log('AI Generated Remarks:\n', rahulCard.data.remarks.map(r => `  - ${r}`).join('\n'));

    console.log('\n--- TESTING REPORT CARD GENERATION (PARENT VIEW FOR CHILD: SANA KHAN) ---');
    // Fetch Sana's (parent's linked child) report card
    const sanaCard = await get('http://localhost:5000/api/insights/report-card/child', {
      'Authorization': `Bearer ${parentToken}`
    });
    console.log('Status Code:', sanaCard.statusCode);
    console.log('Student Name:', sanaCard.data.studentName);
    console.log('Overall Average Grade:', sanaCard.data.metrics.avgMarks + '%');
    console.log('Attendance Rate:', sanaCard.data.metrics.attendanceRate + '%');
    console.log('Subject Averages:', JSON.stringify(reportAveragesBrief(sanaCard.data.subjectAverages)));
    console.log('AI Generated Remarks:\n', sanaCard.data.remarks.map(r => `  - ${r}`).join('\n'));

    console.log('\n--- TESTING SELF REPORT CARD VIEW (STUDENT - RAHUL) ---');
    // Fetch Rahul's own report card
    const selfCard = await get('http://localhost:5000/api/insights/report-card/me', {
      'Authorization': `Bearer ${studentToken}`
    });
    console.log('Status Code:', selfCard.statusCode);
    console.log('Student Name:', selfCard.data.studentName);
    console.log('AI Remarks Count:', selfCard.data.remarks.length);

    console.log('\n--- TESTING SECURITY RESTRICTION: STUDENT ATTEMPTING TO ACCESS OTHER STUDENT\'S CARD (SHOULD FAIL) ---');
    // Rahul (student_id = 1) attempts to fetch Sana's card (student_id = 2)
    const unauthorizedCardFetch = await get('http://localhost:5000/api/insights/report-card/2', {
      'Authorization': `Bearer ${studentToken}`
    });
    console.log('Status Code (should be 403):', unauthorizedCardFetch.statusCode);
    console.log('Response Message:', unauthorizedCardFetch.data.message);

    console.log('\n--- TESTING SECURITY RESTRICTION: PARENT ATTEMPTING TO ACCESS OTHER STUDENT\'S CARD (SHOULD FAIL) ---');
    // Sana's parent attempts to fetch Rahul's card (student_id = 1)
    const unauthorizedParentFetch = await get('http://localhost:5000/api/insights/report-card/1', {
      'Authorization': `Bearer ${parentToken}`
    });
    console.log('Status Code (should be 403):', unauthorizedParentFetch.statusCode);
    console.log('Response Message:', unauthorizedParentFetch.data.message);

    console.log('\n--- SUCCESS: ALL AI REPORT CARD ROUTE TESTS COMPLETED ---');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  }
}

function reportAveragesBrief(subjectAverages) {
  const brief = {};
  Object.keys(subjectAverages).forEach(sub => {
    brief[sub] = subjectAverages[sub].average + '%';
  });
  return brief;
}

test();
