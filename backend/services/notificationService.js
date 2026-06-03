// backend/services/notificationService.js

/**
 * Send simulated Email alert to a user.
 */
exports.sendMockEmail = async (to, name, title, body) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 30));
  
  const formattedLog = `
┌────────────────────────────────────────────────────────────┐
│ ✉️  [EMAIL GATEWAY] OUTBOUND DISPATCH                      │
├────────────────────────────────────────────────────────────┤
│ To:       ${to.padEnd(48)} │
│ Name:     ${name.padEnd(48)} │
│ Subject:  ${('[URGENT] ' + title).substring(0, 48).padEnd(48)} │
├────────────────────────────────────────────────────────────┤
│ Message:  ${body.substring(0, 150).replace(/\n/g, ' ').padEnd(48)}... │
└────────────────────────────────────────────────────────────┘
`;
  console.log('\x1b[36m%s\x1b[0m', formattedLog); // Cyan color
  return true;
};

/**
 * Send simulated SMS alert to a user.
 */
exports.sendMockSMS = async (to, name, title, body) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 30));

  const formattedLog = `
┌────────────────────────────────────────────────────────────┐
│ 📱 [SMS GATEWAY] OUTBOUND BROADCAST                       │
├────────────────────────────────────────────────────────────┤
│ Phone:    ${to.padEnd(48)} │
│ Name:     ${name.padEnd(48)} │
├────────────────────────────────────────────────────────────┤
│ SMS:      ${(title + ': ' + body).substring(0, 120).replace(/\n/g, ' ').padEnd(48)}... │
└────────────────────────────────────────────────────────────┘
`;
  console.log('\x1b[33m%s\x1b[0m', formattedLog); // Yellow/Amber color
  return true;
};
